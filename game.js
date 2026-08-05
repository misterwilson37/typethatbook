// game.js v3.12.4
//
// Typing engine, sprint timer, WPM/accuracy, streaks, leaderboard, practice
// mode, chapter navigation, all modals, write-ahead-log persistence.
//
// ── Full history: CHANGELOG.md § game.js ──────────────────────────────────
//
// v3.12.4 — Two things the overwrite test surfaced. (a) furthestChapter was never
//           validated — v3.12.1 checked the CURRENT chapter and left this one alone,
//           so after a renumber the start screen offered "Jump to furthest point
//           (Ch. 2)" and clicking it hit "Chapter 2 not found". Forgotten rather than
//           clamped: an id that no longer exists is not evidence of how far anyone got.
//           (b) A part-numbered book restarts its chapter numbers and the picker
//           preferred the title over the id, so Heidi listed "Chapter 1" fourteen
//           times and then "Chapter 1" nine more. Prefixed "Pt N \u00b7" when and only
//           when the book has parts.
// v3.12.3 — The chapter-count label had TWO sites and v3.10.0 fixed one. The
//           uncondensed path still printed every spine document, so a two-chapter
//           book advertised "10 ch". ⚠️ Shipped without bumping the constant \u2014 the
//           CHANGELOG said 3.12.3 while the file said 3.12.2. Recorded rather than
//           quietly folded in, because that is the exact drift this round has spent
//           its time catching in other people's work.
// v3.12.2 — The Adventure map drew a dot per SPINE DOCUMENT, so the title page,
//           imprint, dedication, appendix, endnotes, colophon and uncopyright page
//           all appeared as stops on the journey — ten dots for a two-chapter book,
//           with the real chapters fourth and fifth. Body list only now. Also: the
//           book-completion screen actually celebrates, names the book, and links to
//           its credits via index.html#about=<bookId>.
// v3.12.1 — THE FIRST CHAPTER IS NOT ALWAYS CALLED "1". Opening a book with no
//           saved progress hardcoded chapter 1, so a PART-NUMBERED book — whose
//           first chapter is "1.01" — showed a blank page. Live for Heidi, Treasure
//           Island, Little Women and The War of the Worlds since part numbering
//           shipped, and invisible because those four were only ever opened by
//           someone who already had progress. Five sites fixed, plus loadChapter's
//           own recovery path, which also went to "1" and so was a dead end on the
//           same books. Stored progress is now validated against the book, which is
//           the protection Fix C's renumbering needs.
// v3.12.0 — Auto-advance walks the BODY list too, and FINISHING A BOOK IS NOW A
//           THING THAT HAPPENS. v3.11.0 filtered the chapter PICKER and left
//           auto-advance walking the full spine — worse than not filtering, since
//           the picker said the colophon was not a chapter and the Continue button
//           then handed it over. Both "next chapter" sites now walk the body list.
//           Removed the last two parseFloat-on-an-id fallbacks, which invented a
//           chapter that did not exist ("2.14" from Heidi's "1.14") or one in the
//           wrong part ("2.01" from "1.01"). With no next body chapter, null now
//           MEANS something: the book is finished, and says so — the completion
//           moment admin.js has written bodyChapters for since v3.18.x and which
//           had never had a consumer.
// v3.11.0 — The student chapter picker offers BODY chapters only. It used to list
//           every spine document, so the imprint and colophon appeared as things
//           to type — which forced deleting front matter on import, which deleted
//           the copyright notice a CC licence requires be kept intact. A UI
//           default was setting a legal constraint. Front/back matter now stays in
//           the book and never reaches a student; flip anything worth typing to
//           Body in admin staging instead.
//
// ── Load-bearing. Do not "simplify" these ─────────────────────────────────
//
//   * The write-ahead log is MORE durable than the per-sentence writes it
//     replaced. visibilitychange:hidden is the flush event that matters;
//     beforeunload does not fire reliably on Chromebooks.
//   * The leaderboard cache is deliberately NOT busted on the hot path.
//     Doing so cost ~$34,300/year at 7,000 students.
//   * VIEW_MODE is `let`. It changes at runtime three ways: Settings, the
//     splash, and reconciliation against the student's Firestore profile.
//   * applyViewMode() must replay textLoaded + positionSet. A renderer
//     mounted mid-session missed those events and will draw nothing.
import { db, auth } from "./firebase-config.js";
import { doc, getDoc, setDoc, getDocs, collection, addDoc, query, orderBy, limit, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

const VERSION = "3.12.4";
const DEFAULT_BOOK = "wizard_of_oz";
const IDLE_THRESHOLD = 2000;
const AFK_THRESHOLD = 5000; // 5 Seconds to Auto-Pause
const SPRINT_COOLDOWN_MS = 1500;
const SPAM_THRESHOLD = 3;

// ─── Adventure Mode integration ────────────────────────────────────────────
// View toggle. 'classic' = original DOM-rendered text; 'adventure' = canvas
// renderer. The classic view is wholly unchanged: when in adventure mode
// game.js still drives the text-stream DOM (so all position/state logic
// remains valid) — that DOM is just hidden via CSS.
//
// v3.5.0 — VIEW_MODE is `let`, not `const`. It can now change mid-session
// three ways: the settings dropdown, the first-run splash, and reconciliation
// against the student's Firestore profile when they sit down at a machine
// they've never used. Every read site (triggerHardStop, the settings modal)
// reads the live value, so nothing needs to know a swap happened.
//
// Storage, in priority order:
//   localStorage 'ttb_view'                — pre-auth fast path, paints the
//                                            right view before Firestore answers
//   users/{uid}/profile/info.viewMode      — the durable copy, follows the
//                                            student between machines
// The PRESENCE of a valid 'ttb_view' key is also what "has chosen" means
// locally; absence in both places is what triggers the splash. Students who
// already found the Settings toggle are grandfathered in and never see it.
const VALID_VIEWS = ['classic', 'adventure'];
const _storedView = localStorage.getItem('ttb_view');
let VIEW_MODE = VALID_VIEWS.includes(_storedView) ? _storedView : 'classic';

// v3.5.0 — the splash asks on every NEW BOOK by default, because the answer
// can legitimately differ per book: Adventure suits a romp, Classic suits
// something you're reading for content. `viewRemember` is the student's
// "stop asking, just use my pick" opt-out. Default false, so every student
// sees the picker at least once — Jake's call, and correct: the previews are
// the advertisement.
//
// Per-book suppression is sessionStorage, not Firestore. It answers "have I
// already asked about THIS book in THIS sitting", which is a tab-lifetime
// question, costs nothing, and survives a reload (sessionStorage does) while
// resetting cleanly on a new tab or a new day.
let viewRemember = localStorage.getItem('ttb_viewRemember') === '1';
const SPLASH_BOOK_KEY = 'ttb_splashBook';

// Live renderer handles. `adventureModule` caches the dynamic import so a
// student toggling back and forth doesn't re-fetch a 2,400-line module each
// time; `rendererMounted` is the truth about whether listeners are attached
// (VIEW_MODE alone isn't — the import can fail).
let adventureModule = null;
let rendererMounted = false;
let rendererVersionStr = '—';

// Event bus to the adventure renderer. Each emit is fire-and-forget; if the
// renderer isn't mounted nothing happens. Wrapped in try/catch so a buggy
// listener can NEVER crash the typing engine.
function _ttbEmit(type, detail) {
    try {
        document.dispatchEvent(new CustomEvent('ttb:' + type, { detail: detail || {} }));
    } catch (e) {
        // Old browsers without CustomEvent constructor — silently ignore.
        // Adventure mode is opt-in; classic mode never reaches this code path.
    }
}

// Pull the CSS version strings (set as ::before/::after content) and combine
// with JS VERSION constants into a single banner. Async because the adventure
// renderer's version is in a separately-loaded module.
function _readCssVersion(selector) {
    try {
        const raw = getComputedStyle(document.body, selector).content;
        // content comes back as "\"v1.2.3\"" — strip quotes, escapes, and the
        // leading 'v' so the JS-side template can prepend its own consistently.
        return raw.replace(/^["']|["']$/g, '')
                  .replace(/\\/g, '')
                  .replace(/^v/, '') || '?';
    } catch (e) {
        return '?';
    }
}

async function updateVersionBanner(advRendererVersion) {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const styleVer = _readCssVersion('::before');
    const advCssVer = _readCssVersion('::after');
    const advJsVer = advRendererVersion || '—';
    footer.innerHTML =
        `<span style="opacity:.7">game.js</span> v${VERSION}` +
        ` &nbsp;·&nbsp; <span style="opacity:.7">style.css</span> v${styleVer}` +
        ` &nbsp;·&nbsp; <span style="opacity:.7">adventure.css</span> v${advCssVer}` +
        ` &nbsp;·&nbsp; <span style="opacity:.7">adventure-renderer.js</span> v${advJsVer}`;
}

// Everything the renderer needs to reconstruct the current chapter from
// scratch. Called on every chapter load AND whenever the renderer is mounted
// mid-session — a renderer that missed textLoaded draws nothing at all (that's
// its documented behaviour), so a hot swap has to hand it the world again.
function emitTextLoaded() {
    _ttbEmit('textLoaded', {
        fullText: fullText,
        position: currentCharIndex,
        chapterNum: currentChapterNum,
        chapterTitle: (bookMetadata && bookMetadata.chapters)
            ? (bookMetadata.chapters.find(c => c.id === `chapter_${currentChapterNum}`) || {}).title
            : null,
        bookTitle: bookMetadata && bookMetadata.title,
        // Chapter map data (renderer v0.3.0+). Practice mode sends null so
        // the map hides — an AI drill isn't part of the book's journey.
        // ⚠️ BODY CHAPTERS ONLY (v3.12.2). This sent bookMetadata.chapters — the
        // whole spine — so the Adventure map drew a dot for the title page, the
        // imprint, the dedication, the appendix, the endnotes, the colophon and the
        // uncopyright page alongside the actual chapters. On the two-chapter test
        // fixture that is ten dots for two chapters, with the real ones sitting
        // fourth and fifth: exactly the "funky map on the right" Jake saw. On
        // Standard Ebooks it means every book's journey ends several dots past the
        // end of the story.
        //
        // `num` stays the real chapter id, NOT an ordinal, because the renderer
        // matches completedChapters against it.
        chapters: (!isPracticeMode && bookMetadata && bookMetadata.chapters)
            ? bodyChapterList().map(c => ({
                num: String(c.id).replace('chapter_', ''),
                title: c.title || ''
              }))
            : null,
        completedChapters: Array.from(completedChapters),
    });
}

// ─── View mode: apply, persist, reconcile ──────────────────────────────────

// Switch views in place. Replaces the v3.4.x location.reload().
//
// `replay` re-hands the current chapter to a freshly mounted renderer. It's
// false at boot (loadChapter hasn't run yet and will emit on its own) and true
// for every mid-session swap.
//
// Failure mode is deliberately one-directional: if the renderer module won't
// load, we fall back to classic and DON'T persist adventure. A student on a
// flaky connection should not end up with a stored preference for a view that
// didn't load.
async function applyViewMode(mode, opts) {
    const o = opts || {};
    if (!VALID_VIEWS.includes(mode)) mode = 'classic';

    const wantRenderer = (mode === 'adventure');
    // Nothing to do if we're already in this state. The rendererMounted check
    // matters at boot: VIEW_MODE can read 'adventure' from localStorage before
    // init() has mounted anything.
    if (mode === VIEW_MODE && wantRenderer === rendererMounted) {
        if (o.persist) await saveViewMode(mode, o.remember);
        return true;
    }

    let ok = true;

    if (wantRenderer && !rendererMounted) {
        try {
            if (!adventureModule) adventureModule = await import('./adventure-renderer.js');
            adventureModule.mountAdventureRenderer();
            rendererMounted = true;
            rendererVersionStr = adventureModule.RENDERER_VERSION || '?';
        } catch (e) {
            console.warn('Adventure renderer failed to load; staying in classic view.', e);
            rendererVersionStr = 'failed';
            mode = 'classic';
            ok = false;
        }
    } else if (!wantRenderer && rendererMounted) {
        try { adventureModule.unmountAdventureRenderer(); } catch (e) { console.warn(e); }
        rendererMounted = false;
    }

    VIEW_MODE = mode;
    document.body.classList.toggle('view-adventure', mode === 'adventure');
    document.body.classList.toggle('view-classic',   mode === 'classic');

    if (mode === 'classic') {
        // The renderer's keyboard skin repaints .key inline backgrounds to a
        // vintage palette via MutationObserver. unmount() disconnects the
        // observer but leaves the colours it already applied, so the keyboard
        // would stay parchment-toned in classic view. Repaint it.
        colorKeyboardKeys();
        // The classic text stream was transform-positioned while hidden;
        // re-run the layout so it isn't scrolled to a stale offset.
        highlightCurrentChar();
        centerView();
    } else if (o.replay && fullText) {
        emitTextLoaded();
        _ttbEmit('positionSet', { position: currentCharIndex, isResume: true });
    }

    updateVersionBanner(rendererVersionStr);

    if (ok && o.persist) await saveViewMode(mode, o.remember);
    return ok;
}

// Writes both copies. localStorage first and unconditionally, so the choice
// survives even for signed-out / anonymous students; Firestore only when
// there's a real account to hang it on.
//
// Cost: one write, only when a student actually changes views. Folded into the
// same document as initials so it never adds a read — loadProfileInfo() reads
// profile/info once per session and both consumers share it.
async function saveViewMode(mode, remember) {
    if (remember !== undefined) viewRemember = !!remember;
    try {
        localStorage.setItem('ttb_view', mode);
        localStorage.setItem('ttb_viewRemember', viewRemember ? '1' : '0');
    } catch (e) { /* private browsing */ }
    if (profileInfo) {
        profileInfo.viewMode = mode;
        profileInfo.viewRemember = viewRemember;
    }
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        await setDoc(doc(db, "users", currentUser.uid, "profile", "info"),
                     { viewMode: mode, viewRemember: viewRemember }, { merge: true });
    } catch (e) { console.warn("Save view mode failed:", e); }
}

// Called once, after profile/info is loaded and BEFORE loadUserProgress().
// Placement matters: loadChapter() emits textLoaded, so resolving the view
// first means the correct renderer is already listening and no replay is
// needed at boot.
//
// Firestore is authoritative when it has an answer — this is the "different
// Chromebook" path: local had nothing, or had whatever the last kid in that
// seat picked, and the account knows better.
async function resolveViewMode() {
    if (!profileInfo) return;

    if (typeof profileInfo.viewRemember === 'boolean') {
        viewRemember = profileInfo.viewRemember;
        try { localStorage.setItem('ttb_viewRemember', viewRemember ? '1' : '0'); } catch (e) {}
    }

    const remote = profileInfo.viewMode;
    if (!VALID_VIEWS.includes(remote)) return;

    try { localStorage.setItem('ttb_view', remote); } catch (e) {}
    if (remote !== VIEW_MODE || (remote === 'adventure') !== rendererMounted) {
        // replay:true because loadUserProgress() hasn't run yet at boot, but
        // this same function is safe to call later — an empty fullText makes
        // the replay a no-op.
        await applyViewMode(remote, { replay: true });
    }
}

// ─── The view-choice splash ────────────────────────────────────────────────
//
// Two cards, each showing a live-ish mock of the mode it selects. Both mocks
// are hand-built SVG rather than a scaled-down real render: the adventure
// renderer needs a mounted canvas, a chapter, and a RAF loop to show anything,
// and spinning one up inside a chooser to advertise itself is a lot of moving
// parts for a picture. The palettes are lifted verbatim from the real thing
// (#f2e8d5 parchment, #2b221a ink, #a85040 rubric, --carolina-blue) so the
// mock and the mode agree.
//
// The overlay owns a capture-phase keydown listener instead of touching
// isModalOpen / isInputBlocked. Those flags belong to the modal chain
// underneath — the start modal, or the initials prompt if loadInitials() got
// there first — and the splash's job is to sit on top of whatever that is and
// hand it back untouched.

function classicPreviewSVG() {
    return `
<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg" class="vs-art" role="img" aria-label="Classic view preview">
  <rect width="300" height="170" fill="#ffffff"/>
  <rect width="300" height="20" fill="#000000"/>
  <rect y="20" width="300" height="2.5" fill="#4B9CD3"/>
  <text x="8" y="14" font-family="'Courier Prime',monospace" font-size="7.5" fill="#aaa">Active 04:12</text>
  <text x="150" y="14" font-family="'Courier Prime',monospace" font-size="7.5" fill="#fff" text-anchor="middle">WPM: 24 | Acc: 96%</text>
  <text x="292" y="14" font-family="'Courier Prime',monospace" font-size="7.5" fill="#aaa" text-anchor="end">Week 12:40</text>
  <g font-family="'Courier Prime','Courier New',monospace" font-size="13">
    <text x="20" y="58" fill="#000">Dorothy lived in the</text>
    <text x="20" y="82" fill="#000">midst of the great</text>
    <text x="20" y="106" fill="#000">Kansas</text>
    <rect x="76" y="94" width="9.5" height="16" rx="2" fill="#4B9CD3"/>
    <text x="77" y="106" fill="#fff">p</text>
    <text x="86" y="106" fill="#ccc">rairies, with</text>
    <text x="20" y="130" fill="#ccc">Uncle Henry, who was a</text>
  </g>
  <g class="vs-keys">
    <rect x="20" y="142" width="260" height="20" rx="3" fill="#f4f4f4" stroke="#e0e0e0"/>
    <rect x="26" y="146" width="12" height="12" rx="2" fill="#FF69B4" opacity=".22"/>
    <rect x="41" y="146" width="12" height="12" rx="2" fill="#4FC3F7" opacity=".22"/>
    <rect x="56" y="146" width="12" height="12" rx="2" fill="#66BB6A" opacity=".22"/>
    <rect x="71" y="146" width="12" height="12" rx="2" fill="#FFA726" opacity=".22"/>
    <rect x="86" y="146" width="12" height="12" rx="2" fill="#FFA726" opacity=".22"/>
    <rect class="vs-key-hot" x="188" y="146" width="12" height="12" rx="2" fill="#4B9CD3"/>
    <rect x="203" y="146" width="12" height="12" rx="2" fill="#AB47BC" opacity=".22"/>
    <rect x="218" y="146" width="12" height="12" rx="2" fill="#66BB6A" opacity=".22"/>
    <rect x="233" y="146" width="12" height="12" rx="2" fill="#4FC3F7" opacity=".22"/>
    <rect x="248" y="146" width="12" height="12" rx="2" fill="#FF69B4" opacity=".22"/>
  </g>
</svg>`;
}

function adventurePreviewSVG() {
    // Laid out against a real screenshot of the renderer, not from memory. The
    // corrections that mattered:
    //   - the figure stands ON TOP of the letters, not inside them. Letters are
    //     the walkable surface (renderer v0.2.6), so its feet sit at cap-height
    //     above the text baseline, never overlapping the glyphs.
    //   - LEFT edge is the chapter close-up: wobbly rubric route, pilcrow ticks
    //     at paragraph starts, gold marker at the current position.
    //   - RIGHT edge is the book map. Drawn condensed (renderer v1.1.0) because
    //     that is what a real book of any size now looks like.
    //   - gravestones sit on the ground line at the bottom, not mid-air.
    return `
<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg" class="vs-art" role="img" aria-label="Adventure view preview">
  <rect width="300" height="170" fill="#f2e8d5"/>
  <g fill="rgba(120,100,70,0.05)">
    <rect y="34" width="300" height="1"/><rect y="58" width="300" height="1"/>
    <rect y="82" width="300" height="1"/><rect y="106" width="300" height="1"/>
    <rect y="130" width="300" height="1"/>
  </g>
  <rect width="300" height="18" fill="#000"/>
  <rect y="18" width="300" height="2" fill="#4B9CD3"/>
  <text x="150" y="13" font-family="'Courier Prime',monospace" font-size="7" fill="#fff" text-anchor="middle">WPM: 24 | Acc: 96%</text>

  <!-- left: current-chapter close-up -->
  <g>
    <rect x="0" y="20" width="20" height="150" fill="rgba(120,100,70,0.06)"/>
    <line x1="20" y1="20" x2="20" y2="170" stroke="rgba(120,100,70,0.18)" stroke-width="1"/>
    <text x="3" y="30" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="#a85040" font-style="italic">Ch 2</text>
    <path d="M10 36 Q12 58 9 78 Q11 100 10 124" stroke="#a85040" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M10 124 Q9 142 10 156" stroke="rgba(120,100,70,0.3)" stroke-width="2" fill="none" stroke-linecap="round"/>
    <text x="13" y="40" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="rgba(168,80,64,0.6)">&#182;</text>
    <text x="13" y="96" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="rgba(168,80,64,0.6)">&#182;</text>
    <circle cx="10" cy="124" r="3.6" fill="#e8c86a" stroke="#2b221a" stroke-width="1.2"/>
  </g>

  <!-- words are the ground; baseline y=104, cap height ~15 -->
  <g font-family="'IM Fell English',Georgia,serif" font-size="21" fill="#2b221a">
    <text x="38" y="104">the</text>
    <text x="80" y="104">great</text>
    <text x="150" y="104" opacity=".45">Kansas</text>
    <text x="232" y="104" opacity=".22">prairie</text>
  </g>
  <g stroke="#2b221a" stroke-width="1.3" opacity=".45" stroke-linecap="round">
    <line x1="38" y1="108" x2="70" y2="108"/>
    <line x1="80" y1="108" x2="137" y2="108"/>
    <line x1="150" y1="108" x2="216" y2="108"/>
  </g>
  <line x1="137" y1="108" x2="150" y2="108" stroke="#a85040" stroke-width="1.3" stroke-dasharray="2 2"/>

  <!-- figure stands on the letter tops (y=89), clear of the glyphs -->
  <g class="vs-figure" stroke="#2b221a" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="100" cy="55" r="4.3" fill="#2b221a" stroke="none"/>
    <line x1="100" y1="59" x2="100" y2="74"/>
    <path d="M100 74 L95 81 L93 89"/>
    <path d="M100 74 L106 81 L108 89"/>
    <path d="M100 63 L93 69 L90 75"/>
    <path d="M100 63 L108 68 L112 73"/>
  </g>

  <!-- a ghost, and a gravestone on the ground line -->
  <g opacity=".3" fill="none" stroke="#7a7266" stroke-width="1.3">
    <path d="M186 46 a9 9 0 0 1 18 0 v15 l-4.5 -4 -4.5 4 -4.5 -4 -4.5 4 z"/>
    <circle cx="192" cy="50" r="0.9" fill="#7a7266"/><circle cx="198" cy="50" r="0.9" fill="#7a7266"/>
  </g>
  <g opacity=".4">
    <line x1="24" y1="150" x2="272" y2="150" stroke="#c9b99a" stroke-width="1"/>
    <path d="M243 150 v-11 a5.5 5.5 0 0 1 11 0 v11 z" fill="#7a7266" stroke="#2b221a" stroke-width="0.9"/>
    <text x="248.5" y="148" font-family="'IM Fell English',Georgia,serif" font-size="7" fill="#2b221a" text-anchor="middle">k</text>
  </g>

  <!-- right: condensed book map -->
  <g class="vs-map">
    <rect x="280" y="20" width="20" height="150" fill="rgba(120,100,70,0.06)"/>
    <line x1="280" y1="20" x2="280" y2="170" stroke="rgba(120,100,70,0.18)" stroke-width="1"/>
    <line x1="290" y1="34" x2="290" y2="150" stroke="rgba(120,100,70,0.3)" stroke-width="2" stroke-linecap="round"/>
    <path d="M290 34 Q292 48 289 62 Q291 72 290 78" stroke="#a85040" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <g stroke="rgba(120,100,70,0.45)" stroke-width="0.8">
      <line x1="287" y1="46" x2="293" y2="46"/><line x1="287" y1="69" x2="293" y2="69"/>
      <line x1="287" y1="92" x2="293" y2="92"/><line x1="287" y1="115" x2="293" y2="115"/>
      <line x1="287" y1="138" x2="293" y2="138"/>
    </g>
    <circle cx="290" cy="34" r="2.6" fill="rgba(168,80,64,0.75)"/>
    <circle cx="290" cy="150" r="2.6" fill="rgba(120,100,70,0.5)"/>
    <circle cx="290" cy="78" r="4" fill="#e8c86a" stroke="#2b221a" stroke-width="1.2"/>
  </g>

  <g class="vs-keys">
    <rect x="24" y="156" width="238" height="12" rx="2" fill="#e6d9bd" stroke="#c9b99a"/>
    <rect x="29" y="158" width="9" height="8" rx="1.5" fill="#8d6b6b" opacity=".3"/>
    <rect x="41" y="158" width="9" height="8" rx="1.5" fill="#6b7d8d" opacity=".3"/>
    <rect x="53" y="158" width="9" height="8" rx="1.5" fill="#6f7d5f" opacity=".3"/>
    <rect class="vs-key-hot" x="170" y="158" width="9" height="8" rx="1.5" fill="#2b221a"/>
    <rect x="182" y="158" width="9" height="8" rx="1.5" fill="#7d6b8d" opacity=".3"/>
    <rect x="194" y="158" width="9" height="8" rx="1.5" fill="#6b7d8d" opacity=".3"/>
  </g>
</svg>`;
}

// Resolves once the student has picked. Never rejects.
function showViewSplash(opts) {
    const o = opts || {};
    return new Promise((resolve) => {
        const existing = document.getElementById('view-splash');
        if (existing) existing.remove();

        let picked = VALID_VIEWS.includes(VIEW_MODE) ? VIEW_MODE : 'classic';

        const el = document.createElement('div');
        el.id = 'view-splash';
        el.innerHTML = `
          <div class="vs-panel" role="dialog" aria-label="Choose how you want to read">
            <div class="vs-head">
              <div class="vs-title">How do you want to read this book?</div>
              <div class="vs-sub">Both modes type the same words and count the same. Pick whichever you like — you can change it any time in Settings.</div>
            </div>
            <div class="vs-cards">
              <button class="vs-card" data-view="classic" type="button">
                <div class="vs-art-wrap">${classicPreviewSVG()}</div>
                <div class="vs-name">Classic</div>
                <div class="vs-desc">The book, plainly. Clean text, colour-coded keyboard, nothing between you and the page.</div>
                <div class="vs-badge">Selected</div>
              </button>
              <button class="vs-card" data-view="adventure" type="button">
                <div class="vs-art-wrap">${adventurePreviewSVG()}</div>
                <div class="vs-name">Adventure</div>
                <div class="vs-desc">Walk the story. Words become ground, mistakes trip you up, and a map tracks how far you've come.</div>
                <div class="vs-badge">Selected</div>
              </button>
            </div>
            <div class="vs-foot">
              <label class="vs-remember">
                <input type="checkbox" id="vs-remember-box" ${viewRemember ? 'checked' : ''}>
                <span>Use this for every book — stop asking me</span>
              </label>
              <button id="vs-go" class="vs-go" type="button">Start Reading &rarr;</button>
            </div>
          </div>`;
        document.body.appendChild(el);

        const cards = el.querySelectorAll('.vs-card');
        const paint = () => cards.forEach(c =>
            c.classList.toggle('is-picked', c.dataset.view === picked));
        cards.forEach(c => {
            c.onclick = () => { picked = c.dataset.view; paint(); };
        });
        paint();

        // Capture phase + stopPropagation: the game's own document keydown
        // listener must not see a single one of these. Left/Right move the
        // selection, Enter commits — a kid who never touches the trackpad can
        // still get through it.
        const onKey = (e) => {
            if (e.key === 'ArrowLeft')  { picked = 'classic';   paint(); }
            else if (e.key === 'ArrowRight') { picked = 'adventure'; paint(); }
            else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(); }
            e.stopPropagation();
        };
        document.addEventListener('keydown', onKey, true);

        let done = false;
        async function commit() {
            if (done) return;
            done = true;
            const remember = !!document.getElementById('vs-remember-box').checked;
            document.removeEventListener('keydown', onKey, true);
            el.classList.add('vs-closing');
            try {
                if (o.bookId) sessionStorage.setItem(SPLASH_BOOK_KEY, o.bookId);
            } catch (err) { /* private browsing */ }
            await applyViewMode(picked, { replay: true, persist: true, remember: remember });
            setTimeout(() => { el.remove(); resolve(picked); }, 180);
        }
        el.querySelector('#vs-go').onclick = commit;
    });
}

// Called from loadChapter(). The sessionStorage check makes this fire exactly
// once per book per tab, which is what "ask again when they pick a new book"
// means in practice — a chapter advance or a reload mid-book doesn't re-ask.
function maybeShowViewSplash() {
    if (isPracticeMode) return;              // an AI drill isn't "a book"
    if (viewRemember) return;
    if (document.getElementById('view-splash')) return;
    let seen = null;
    try { seen = sessionStorage.getItem(SPLASH_BOOK_KEY); } catch (e) {}
    if (seen === currentBookId) return;
    showViewSplash({ bookId: currentBookId });
}
// ───────────────────────────────────────────────────────────────────────────

// Hand Guide
let handGuideEnabled = localStorage.getItem('ttb_handGuide') === 'true';
let handGuideRainbow = localStorage.getItem('ttb_handGuideRainbow') !== 'false'; // default true
let handGuideColor = localStorage.getItem('ttb_handGuideColor') || '#4FC3F7';
let fingerMap = {};
const FINGER_COLORS = {
    'left-pinky':   '#FF69B4', // pink
    'left-ring':    '#E53935', // red
    'left-middle':  '#FF9800', // orange
    'left-index':   '#FDD835', // yellow
    'right-index':  '#43A047', // green
    'right-middle': '#1E88E5', // blue
    'right-ring':   '#8E24AA', // purple
    'right-pinky':  '#4FC3F7', // baby blue
    'left-thumb':   '#FDD835', // yellow (same as index)
    'right-thumb':  '#43A047', // green (same as index)
};

function getFingerColor(fingerName) {
    if (handGuideRainbow) return FINGER_COLORS[fingerName] || '#4FC3F7';
    return handGuideColor;
}

// ADMIN WHITELIST - same list as index.html, used to show admin link
const ADMIN_EMAILS = [
    "jacob.wilson@sumnerk12.net",
    "jacob.v.wilson@gmail.com",
];

// STATE — URL param takes priority, then localStorage, then default
function getBookIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('book');
}
let currentBookId = getBookIdFromUrl() || localStorage.getItem('currentBookId') || DEFAULT_BOOK;
localStorage.setItem('currentBookId', currentBookId); // sync
let currentUser = null;
let bookData = null;
let bookMetadata = null;
let fullText = "";
let currentCharIndex = 0;
let savedCharIndex = 0;
let lastSavedIndex = 0;
let currentChapterNum = 1;
let furthestChapter = 1;
let furthestCharIndex = 0;
let autoStartNext = false; // skip start modal when advancing chapters
let ggRealCharIndex = -1;  // real position before Game Genie warps
let ggAllowMistakes = false; // bypass mistake limit (session only, not persisted)
let ggBypassIdle = false; // bypass AFK/idle timer (session only)

// Stats
let sessionLimit = 30;
let sessionValueStr = "30";
const savedSession = localStorage.getItem('ttb_sessionLength');
if (savedSession) { sessionValueStr = savedSession; sessionLimit = (savedSession === 'infinity') ? 'infinity' : parseInt(savedSession); }
let statsData = { secondsToday:0, secondsWeek:0, charsToday:0, charsWeek:0, mistakesToday:0, mistakesWeek:0, lastDate:"", weekStart:0 };

// Goals
let goals = { dailySeconds: 0, weeklySeconds: 0 };
let dailyGoalCelebrated = false;
let weeklyGoalCelebrated = false;

// Game Vars
let mistakes = 0; let sprintMistakes = 0;
let consecutiveMistakes = 0;
let activeSeconds = 0; let sprintSeconds = 0;
let sprintCharStart = 0; let timerInterval = null;
let isGameActive = false; let isOvertime = false;
let isModalOpen = false; let isInputBlocked = false;
let modalGeneration = 0;
let isHardStop = false;
let backspaceOrigin = -1; // tracks where we were when backspacing started
let bookSwitchPending = false;
let anonSprintCount = 0;
let anonTotalSeconds = 0;
let anonPromptShown = false;
let anonLoginInProgress = false; // prevent auth handler from reloading during anon prompt
let modalActionCallback = null;
let chapterCompleteAt = 0;   // when the chapter-complete modal opened (any-key grace period)
let lastInputTime = 0; let timeAccumulator = 0;
let wpmHistory = []; let accuracyHistory = [];
let currentLetterStatus = 'clean';
let mistakesAtCurrent = 0;   // uncorrected mistakes at the current letter (one backspace undoes one)

// Classic-view shade for repeated mistakes at the same letter: the letter's
// background reddens a step per mistake and lightens a step per backspace.
function applyMissShade(el, n) {
    if (!el) return;
    if (n <= 0) { el.style.removeProperty('background-color'); return; }
    const alpha = Math.min(0.10 + 0.16 * (n - 1), 0.70);
    el.style.backgroundColor = `rgba(211, 47, 47, ${alpha.toFixed(2)})`;
}

// Streak tracking
let currentStreak = 0;
let bestStreak = 0;
let streakMilestone = 0; // last celebrated milestone

// Most-missed characters (session-wide)
let missedCharsMap = {};

// Sprint history (session-wide)
let sprintHistory = [];

// Completed chapters
let completedChapters = new Set();

// Anonymous session tracking for retroactive save
let anonCharsTyped = 0;
let anonMistakes = 0;

// Anonymous infinite-mode login reminders (reset daily)
let anonInfiniteReminders = 0; // 0 = none shown, 1 = first shown, 2 = both shown
const ANON_INFINITE_REMINDER_1 = 150; // 2.5 min
const ANON_INFINITE_REMINDER_2 = 300; // 5 min
function loadAnonReminderState() {
    const saved = localStorage.getItem('ttb_anonInfiniteReminders');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.date === getLocalDateStr()) {
                anonInfiniteReminders = data.count || 0;
            }
        } catch(e) {}
    }
}
function saveAnonReminderState() {
    localStorage.setItem('ttb_anonInfiniteReminders', JSON.stringify({
        date: getLocalDateStr(),
        count: anonInfiniteReminders
    }));
}

// users/{uid}/profile/info, read exactly once per session. Holds initials,
// leaderboardOptOut and (v3.5.0) viewMode. Three consumers, one read — adding
// a field here is free, adding a document is not.
let profileInfo = null;

// The button label loadChapter() computed for the start modal ("Start Reading"
// / "Resume"). Stashed so the splash can restore the start modal it covered
// without guessing at the label.
let lastStartBtnLabel = "Start Reading";

// Leaderboard
let userInitials = '';
let leaderboardOptOut = false;
let leaderboardCache = {}; // { category: [entries], ... }
let leaderboardCacheTime = 0;
const LB_CACHE_MS = 600000;   // 10 minutes (was 30s, and was being busted anyway)

// The student's own leaderboard doc, read once per session instead of once per
// sprint. We are the only writer for our own doc, so an in-memory copy stays
// accurate. Admin resets bust it explicitly.
let lbOwnEntry = null;        // null = not yet read this session

// Write coalescing. totalSecondsWeek grows every sprint, so without this the
// doc would be written 20x per ten-minute block. Accumulate locally, flush on
// a timer / a new personal best / the tab going away.
// Matched to FLUSH_INTERVAL_MS. The board itself is cached for 10 minutes, so
// writing the underlying doc more often than the flush cadence buys nothing.
const LB_WRITE_MIN_GAP_MS = 300000;   // 5 minutes
let lbPendingSeconds = 0;
let lbLastWriteTime = 0;
let lbDirty = false;

// Top-10 cutoff memory, persisted so we can answer "could this student
// plausibly be on the board?" without a network call. Thresholds only ever
// drift upward as records improve, which makes a stale value CONSERVATIVE:
// we may miss a placement celebration, but we never invent one.
const LB_THRESHOLD_KEY = 'ttb_lbThresholds';
let lbThresholds = null;      // { bestWPM: n, bestStreak: n, ... }

function loadLbThresholds() {
    if (lbThresholds) return lbThresholds;
    try {
        const raw = localStorage.getItem(LB_THRESHOLD_KEY);
        lbThresholds = raw ? JSON.parse(raw) : {};
    } catch (_) { lbThresholds = {}; }
    return lbThresholds;
}

function saveLbThresholds(lists) {
    const t = {};
    for (const cat of LB_CATEGORIES) {
        const list = lists[cat.key] || [];
        // A board with room left has an effective cutoff of 0 — anyone qualifies.
        t[cat.key] = list.length >= 10 ? (list[list.length - 1][cat.key] || 0) : 0;
    }
    lbThresholds = t;
    try { localStorage.setItem(LB_THRESHOLD_KEY, JSON.stringify(t)); } catch (_) {}
}

// Practice Mode
const functions = getFunctions();
const generatePractice = httpsCallable(functions, 'generatePractice');
let isPracticeMode = false;
let practiceRealBookData = null;    // saved real book state
let practiceRealChapterNum = null;
let practiceRealCharIndex = null;
let practiceRealLastSavedIndex = null;
let practiceRealFurthestChapter = null;
let practiceRealFurthestCharIndex = null;
let practiceProblemChars = [];      // the chars that triggered this practice
let practicePrompt = '';            // the prompt sent to Gemini
let practiceText = '';              // the generated text
let practiceMissedSnapshot = {};   // snapshot of missedCharsMap at practice start
let practiceTypingAccumulator = 0;  // seconds typed since last practice (or session start)
let hasDonePractice = false;        // whether practice has been used this session
// Server-authoritative daily allowance, learned from the last successful
// generatePractice() call (index.js DAILY_LIMIT = 5). null = not known yet.
// Checked BEFORE offering the button so a student out of sessions doesn't click,
// wait for a round-trip, and get an error for their trouble.
let practiceRemainingToday = null;
const PRACTICE_FIRST_UNLOCK = 150;  // 2.5 min before first practice
const PRACTICE_COOLDOWN = 60;       // 1 min between subsequent practices

// Profanity filter for initials (covers letter substitutions kids try)
const BLOCKED_INITIALS = new Set([
    'ASS','AZZ','A55','BCH','BJ','BJB','BJS','CNT','COC','COK','CUM','CUK',
    'DCK','DIK','DIX','DMN','DNG','DIC','FAG','FAT','FCK','FKU','FUC','FUK','FUQ',
    'GAY','GEI','GEY','GOD','HOR','JEW','JIZ','JZZ','KKK','KIK','KYK',
    'LSD','MFF','NGR','NIG','NGA','NUT','PIS','PMS','POO','PEE','PUS',
    'RAP','SEX','SHT','SLT','STD','SUK','SUC','TIT','THC','TWT','VAG',
    'WTF','WOP','XTC','XXX',
]);

function isInitialsClean(val) {
    const upper = val.toUpperCase();
    if (BLOCKED_INITIALS.has(upper)) return false;
    // Also check with common substitutions reversed (0→O, 1→I, 3→E, 5→S, etc.)
    const normalized = upper
        .replace(/0/g, 'O').replace(/1/g, 'I').replace(/3/g, 'E')
        .replace(/4/g, 'A').replace(/5/g, 'S').replace(/8/g, 'B');
    if (normalized !== upper && BLOCKED_INITIALS.has(normalized)) return false;
    return true;
}

function getDefaultInitials() {
    if (!currentUser || !currentUser.displayName) return '';
    const parts = currentUser.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return '';
}

// DOM
const textStream = document.getElementById('text-stream');
const keyboardDiv = document.getElementById('virtual-keyboard');
const timerDisplay = document.getElementById('timer-display');
const accDisplay = document.getElementById('acc-display');
const wpmDisplay = document.getElementById('wpm-display');
const streakDisplay = document.getElementById('streak-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const trophyBtn = document.getElementById('trophy-btn');
const userInfo = document.getElementById('user-info');
const userNameDisplay = document.getElementById('user-name');

// Security: escape HTML to prevent XSS from Firestore data
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

async function init() {
    console.log("Initializing JS v" + VERSION);
    loadAnonReminderState();
    // Build a consolidated version banner showing every loaded file. Helps
    // confirm GitHub Pages cache is serving fresh code (not a stale CSS or JS).
    // CSS versions are exposed via the `content` property of body::before /
    // body::after — see style.css and adventure.css for the values.

    // Open work §9 item 5: title was hardcoded to "TypeThatBook v3.0.1.1" in
    // game.html and had been wrong for four releases.
    document.title = "TypeThatBook v" + VERSION;

    // ─── Adventure: apply the locally cached view mode ───
    // This is the pre-auth paint. It uses localStorage only, so it's instant
    // and can be wrong — resolveViewMode() corrects it against the student's
    // profile a moment later, without a reload. `replay` is false: loadChapter
    // hasn't run, so there is no world to hand the renderer yet.
    document.body.classList.add('view-classic');
    await applyViewMode(VIEW_MODE, { replay: false });
    // applyViewMode paints the banner on every path that actually changes
    // something; a boot straight into classic changes nothing, so call it here.
    updateVersionBanner(rendererVersionStr);

    if (!document.getElementById('menu-btn')) {
        const btn = document.createElement('button');
        btn.id = 'menu-btn';
        btn.innerHTML = '&#9881;';
        btn.onclick = openMenuModal;
        document.body.appendChild(btn);
    }

    // Game Genie button (admin only, hidden until auth confirms)
    if (!document.getElementById('genie-btn')) {
        const gg = document.createElement('button');
        gg.id = 'genie-btn';
        gg.className = 'hidden';
        gg.innerHTML = '<span class="gg-flame">🔥</span><span class="gg-fire">G</span><span class="gg-fire gg-fire2">G</span><span class="gg-flame">🔥</span>';
        gg.title = 'Game Genie';
        gg.onclick = openGameGenie;
        document.body.appendChild(gg);
    }

    createKeyboard();
    buildFingerMap();
    createHandGuide();
    setupAuthListeners();
    trophyBtn.onclick = () => openLeaderboard();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            updateAuthUI(true);
            // Show Game Genie for admins
            const ggBtn = document.getElementById('genie-btn');
            if (ggBtn) ggBtn.classList.toggle('hidden', !ADMIN_EMAILS.includes(user.email));
            // Skip full reload if login came from anon prompt (we handle it ourselves)
            if (anonLoginInProgress) return;
            try {
                await loadBookMetadata();
                // Order matters. loadProfileInfo() is the session's single read
                // of profile/info; resolveViewMode() consumes it and settles
                // which renderer is mounted BEFORE loadUserProgress() calls
                // loadChapter(), whose textLoaded emit then lands correctly
                // with no replay needed.
                await loadProfileInfo();
                await resolveViewMode();
                await loadUserProgress();
                await loadUserStats();
                // Self-heal: if today > week, data was corrupted during transition
                await loadGoals();
                // Refresh the top-bar timer now that stats AND goals are
                // loaded — setupGame() ran before either, so its initial
                // render showed 00:00 with no daily-goal denominator. This
                // call paints the real "Day 4:32 / 8:00" state immediately,
                // before the kid types a single character.
                updateTimerUI();
                // Populate weekly HUD immediately (before first tick)
                const _hudW = document.getElementById('hud-week');
                if (_hudW) {
                    const _wm = Math.floor(statsData.secondsWeek / 60);
                    const _ws = statsData.secondsWeek % 60;
                    let _txt = 'Week\u00a0' + _wm + ':' + String(_ws).padStart(2, '0');
                    if (goals.weeklySeconds > 0) {
                        _txt += '\u00a0/\u00a0' + Math.floor(goals.weeklySeconds/60) + ':' +
                                String(goals.weeklySeconds % 60).padStart(2,'0');
                    }
                    _hudW.textContent = _txt;
                }
                await loadInitials();
            } catch(e) { console.error("Init Error:", e); }
            trophyBtn.classList.remove('hidden');
        } else {
            // No anonymous sign-in — just load the book as read-only
            currentUser = null;
            updateAuthUI(false);
            const ggBtn = document.getElementById('genie-btn');
            if (ggBtn) ggBtn.classList.add('hidden');
            trophyBtn.classList.add('hidden');
            try {
                await loadBookMetadata();
                loadChapter(firstBodyChapterId() || 1);
            } catch(e) { console.error("Init Error:", e); }
        }
    });
}

function setupAuthListeners() {
    loginBtn.addEventListener('click', async () => {
        try { await signInWithPopup(auth, new GoogleAuthProvider()); }
        catch (e) { alert("Login failed: " + e.message); }
    });
    logoutBtn.addEventListener('click', async () => {
        try { await signOut(auth); location.reload(); }
        catch (e) { console.error(e); }
    });
}

function updateAuthUI(isLoggedIn) {
    if (isLoggedIn && !currentUser.isAnonymous) {
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userNameDisplay.innerText = currentUser.displayName || "Reader";
    } else {
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
}

async function loadBookMetadata() {
    try {
        const docRef = doc(db, "books", currentBookId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            bookMetadata = docSnap.data();
        } else {
            if(currentBookId !== DEFAULT_BOOK) {
                currentBookId = DEFAULT_BOOK;
                localStorage.setItem('currentBookId', DEFAULT_BOOK);
                await loadBookMetadata();
            }
        }
    } catch (e) { console.warn("Meta Error:", e); }
}

async function loadUserStats() {
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        const today = new Date();
        const dateStr = getLocalDateStr(today);
        const weekStart = getWeekStart(today);
        const docRef = doc(db, "users", currentUser.uid, "stats", "time_tracking");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lastDate === dateStr) {
                statsData.secondsToday = data.secondsToday || 0;
                statsData.charsToday = data.charsToday || 0;
                statsData.mistakesToday = data.mistakesToday || 0;
            } else {
                statsData.secondsToday = 0; statsData.charsToday = 0; statsData.mistakesToday = 0;
            }
            if ((data.weekStart || '') === weekStart) {
                statsData.secondsWeek = data.secondsWeek || 0;
                statsData.charsWeek   = data.charsWeek   || 0;
                statsData.mistakesWeek= data.mistakesWeek|| 0;
            } else {
                statsData.secondsWeek = 0; statsData.charsWeek = 0; statsData.mistakesWeek = 0;
            }
        }
        statsData.lastDate = dateStr;
        statsData.weekStart = weekStart;
    } catch (e) {}
}

function getLocalDateStr(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function getWeekStart(date) {
    // Returns "YYYY-MM-DD" string — consistent with learn.js, immune to DST bugs
    const d = new Date(date);
    const diff = (d.getDay() + 1) % 7;
    d.setDate(d.getDate() - diff);
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}



// Goals, class, and building change roughly never, but this used to cost two
// document reads on every single page load (user doc, then class doc), plus a
// third for the settings fallback. Cached for a day. `classId`/`schoolId` are
// captured here and stamped onto every log so reports can be scoped without
// scanning the collection — see MULTITENANCY.md.
const GOALS_CACHE_KEY = 'ttb_goalsCache_v1';

// ─── Student school picker (v3.8.0) ───────────────────────────────────────
//
// Rules already allow this: `match /users/{uid}` has
// `allow update: if request.auth.uid == uid`, and `schools` is
// `allow read: if signedIn()`. No rules change, and none should be needed —
// if a change looks necessary, the design is wrong.
//
// What a student can actually do by setting this: stamp their OWN future logs
// with a building, which makes them visible to that building's staff. They
// cannot read anything new. The worst case is a student picking a school they
// don't attend, which puts their own name in that school's reports — visible,
// traceable, and fixable by a teacher reassigning them. Weighed against the
// status quo, where an unassigned student is invisible to everyone, that's the
// better failure.
const SCHOOLS_CACHE_KEY = 'ttb_schoolsCache_v1';
const SCHOOLS_CACHE_MS = 24 * 3600 * 1000;
let schoolsList = null;

async function loadSchools() {
    if (schoolsList) return schoolsList;
    try {
        const raw = localStorage.getItem(SCHOOLS_CACHE_KEY);
        if (raw) {
            const c = JSON.parse(raw);
            if (c && Array.isArray(c.schools) && (Date.now() - c.at) < SCHOOLS_CACHE_MS) {
                schoolsList = c.schools;
                return schoolsList;
            }
        }
    } catch (_) {}
    try {
        const snap = await getDocs(collection(db, "schools"));
        schoolsList = [];
        snap.forEach(d => schoolsList.push({ id: d.id, name: (d.data().name || d.id) }));
        schoolsList.sort((x, y) => x.name.localeCompare(y.name));
        try {
            localStorage.setItem(SCHOOLS_CACHE_KEY,
                JSON.stringify({ at: Date.now(), schools: schoolsList }));
        } catch (_) {}
    } catch (e) {
        console.warn('School list unreadable:', e);
        schoolsList = [];
    }
    return schoolsList;
}

async function saveStudentSchool(schoolId) {
    if (!currentUser || currentUser.isAnonymous) return false;
    try {
        await setDoc(doc(db, "users", currentUser.uid), { schoolId: schoolId }, { merge: true });
        ttbSchoolId = schoolId;
        // The goals cache carries schoolId, so a stale copy would keep stamping
        // the old building onto logs until it expired.
        try { localStorage.removeItem(GOALS_CACHE_KEY); } catch (_) {}
        return true;
    } catch (e) {
        console.warn('Save school failed:', e);
        return false;
    }
}
const GOALS_CACHE_MS = 86400000;   // 1 day

async function loadGoals() {
    try {
        // Cache hit?
        try {
            const raw = localStorage.getItem(GOALS_CACHE_KEY);
            if (raw) {
                const c = JSON.parse(raw);
                if (c.uid === (currentUser && currentUser.uid) &&
                    (Date.now() - c.at) < GOALS_CACHE_MS) {
                    goals.dailySeconds = c.dailySeconds || 0;
                    goals.weeklySeconds = c.weeklySeconds || 0;
                    ttbClassId = c.classId || '';
                    ttbSchoolId = c.schoolId || '';
                    applyGoalCelebrationState();
                    return;
                }
            }
        } catch (_) { /* fall through to a real read */ }

        let resolved = false;
        ttbClassId = ''; ttbSchoolId = '';
        if (currentUser && !currentUser.isAnonymous) {
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (userSnap.exists()) {
                const ud = userSnap.data();
                ttbClassId = ud.classId || '';
                ttbSchoolId = ud.schoolId || '';
                if (ud.classId) {
                    const classSnap = await getDoc(doc(db, 'classes', ud.classId));
                    if (classSnap.exists()) {
                        const cd = classSnap.data();
                        goals.dailySeconds  = cd.dailySeconds  || 0;
                        goals.weeklySeconds = cd.weeklySeconds || 0;
                        // A class knows its building; the user doc may not yet.
                        if (!ttbSchoolId && cd.schoolId) ttbSchoolId = cd.schoolId;
                        console.log(`Goals from class "${cd.name}": daily=${goals.dailySeconds}s, weekly=${goals.weeklySeconds}s`);
                        resolved = true;
                    }
                }
            }
        }
        if (!resolved) {
            const goalsSnap = await getDoc(doc(db, "settings", "goals"));
            if (goalsSnap.exists()) {
                const data = goalsSnap.data();
                goals.dailySeconds  = data.dailySeconds  || 0;
                goals.weeklySeconds = data.weeklySeconds || 0;
                console.log(`Goals from settings: daily=${goals.dailySeconds}s, weekly=${goals.weeklySeconds}s`);
            }
        }

        try {
            localStorage.setItem(GOALS_CACHE_KEY, JSON.stringify({
                uid: currentUser ? currentUser.uid : '', at: Date.now(),
                dailySeconds: goals.dailySeconds, weeklySeconds: goals.weeklySeconds,
                classId: ttbClassId, schoolId: ttbSchoolId
            }));
        } catch (_) {}

        applyGoalCelebrationState();
    } catch (e) {
        console.error("loadGoals failed:", e);
    }
}

function applyGoalCelebrationState() {
    if (goals.dailySeconds  > 0 && statsData.secondsToday >= goals.dailySeconds) {
        dailyGoalCelebrated = true;
    }
    if (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds) {
        weeklyGoalCelebrated = true;
    }
}

async function loadUserProgress() {
    textStream.innerHTML = "Loading progress...";
    try {
        if (!currentUser || currentUser.isAnonymous) {
            // No user — start from the beginning, which is the first BODY chapter
            // and is not always called "1".
            const start = firstBodyChapterId() || 1;
            currentChapterNum = start;
            savedCharIndex = 0;
            lastSavedIndex = 0;
            loadChapter(start);
            return;
        }
        const docRef = doc(db, "users", currentUser.uid, "progress", currentBookId);
        const docSnap = await getDoc(docRef);
        currentChapterNum = firstBodyChapterId() || 1;
        savedCharIndex = 0;
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.chapter !== undefined && data.chapter !== null) currentChapterNum = data.chapter;
            if (data.charIndex !== undefined) savedCharIndex = data.charIndex;
            if (data.completedChapters && Array.isArray(data.completedChapters)) {
                completedChapters = new Set(data.completedChapters.map(String));
            }
            // Load furthest tracking
            if (data.furthestChapter !== undefined) furthestChapter = data.furthestChapter;
            else furthestChapter = currentChapterNum;
            if (data.furthestCharIndex !== undefined) furthestCharIndex = data.furthestCharIndex;
            else furthestCharIndex = savedCharIndex;
        }
        lastSavedIndex = savedCharIndex;
        // Replay anything the previous session couldn't get to Firestore before
        // it died. Must run after the Firestore read so it can compare positions.
        currentCharIndex = savedCharIndex;
        walRecover();
        savedCharIndex = currentCharIndex;
        lastSavedIndex = savedCharIndex;

        // ⚠️ The stored chapter may no longer exist — see isKnownBodyChapter().
        // Checked AFTER walRecover(), because the WAL can also carry a stale id.
        if (bodyChapterList().length && !isKnownBodyChapter(currentChapterNum)) {
            const fallback = firstBodyChapterId();
            console.warn('Stored chapter "' + currentChapterNum + '" is not in this ' +
                         'book any more (renumbered?). Starting at "' + fallback + '".');
            currentChapterNum = fallback;
            savedCharIndex = 0; currentCharIndex = 0; lastSavedIndex = 0;
        }
        // ⚠️ furthestChapter NEEDS THE SAME CHECK (v3.12.4). v3.12.1 validated the
        // CURRENT chapter and left the furthest one alone, so after a renumber the
        // start screen still offered "Jump to furthest point (Ch. 2)" against a book
        // whose chapters are now 1.01 and 2.01 — and clicking it produced "Chapter 2
        // not found. Returning to the start of the book." Exactly the dead end the
        // v3.12.1 note said it was there to prevent, one variable over.
        //
        // Forgotten rather than clamped: an id that no longer exists is not evidence
        // of how far anyone got, and inventing a nearest match would silently move a
        // student's furthest point.
        if (bodyChapterList().length && !isKnownBodyChapter(furthestChapter)) {
            console.warn('Furthest chapter "' + furthestChapter + '" is not in this ' +
                         'book any more (renumbered?). Forgetting it.');
            furthestChapter = currentChapterNum;
            furthestCharIndex = 0;
        }
        loadChapter(currentChapterNum);
    } catch (e) { loadChapter(firstBodyChapterId() || 1); }
}

// Chapter text is immutable once authored and it's the biggest single read in
// the app. Cached locally so a student returning to the same chapter — which is
// the normal case, every day — reads zero documents and downloads zero bytes.
// Chapter text is immutable once authored and it's the biggest single read in
// the app. Cached locally so a student returning to the same chapter — which is
// the normal case, every day — reads zero documents and downloads zero bytes.
//
// ⚠️ THE INVALIDATION IS REAL NOW. IT WASN'T BEFORE.
//
// The comment that stood here for several versions said "admin.html bumps
// `contentVersion` on a book when a chapter is edited, which invalidates the
// entry." That was false. No version of admin.js up to and including 3.11.0
// ever wrote that field, so the expiry below was the ONLY invalidation this
// cache had — and it was seven days. Fix a typo, and a student holding a cached
// copy read the typo for a week.
//
// admin.js **3.12.0** actually writes it, from all seven paths that change
// chapter text. So seven days is now a genuine ceiling for a book nobody edits,
// not a silent floor on how long a correction takes to land.
//
// ⚠️ IF YOU EVER SEE AN EDIT FAIL TO REACH STUDENTS, check that admin.js is
// 3.12.0 or later before you touch anything here. Rolling admin.js back
// reintroduces the week-long staleness with no other symptom.
const CHAPTER_CACHE_MS = 7 * 86400000;

function chapterCacheKey(bookId, chapterId) { return `ttb_ch_v1:${bookId}:${chapterId}`; }

function readChapterCache(bookId, chapterId) {
    try {
        const raw = localStorage.getItem(chapterCacheKey(bookId, chapterId));
        if (!raw) return null;
        const c = JSON.parse(raw);
        const bookVer = (bookMetadata && bookMetadata.contentVersion) || null;
        if (bookVer !== null && c.ver !== bookVer) return null;
        if ((Date.now() - c.at) > CHAPTER_CACHE_MS) return null;
        return c.data;
    } catch (_) { return null; }
}

function writeChapterCache(bookId, chapterId, data) {
    try {
        localStorage.setItem(chapterCacheKey(bookId, chapterId), JSON.stringify({
            at: Date.now(),
            ver: (bookMetadata && bookMetadata.contentVersion) || null,
            data
        }));
    } catch (e) {
        // Quota exceeded — drop other cached chapters and move on. The cache is
        // an optimisation; never let it break loading a chapter.
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith('ttb_ch_v1:'))
                .forEach(k => localStorage.removeItem(k));
        } catch (_) {}
    }
}

async function loadChapter(chapterNum) {
    textStream.innerHTML = `Loading Chapter...`;
    const chapterId = "chapter_" + chapterNum;
    try {
        const cached = readChapterCache(currentBookId, chapterId);
        if (cached) {
            bookData = cached;
            currentChapterNum = chapterNum;
            setupGame();
            getHeaderHTML();
            initBookProgressBar();
            return;
        }
        const docRef = doc(db, "books", currentBookId, "chapters", chapterId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            bookData = docSnap.data();
            writeChapterCache(currentBookId, chapterId, bookData);
            currentChapterNum = chapterNum;
            setupGame();
            getHeaderHTML(); // update book info bar
            initBookProgressBar();
        } else {
            // Recovery goes to the first BODY chapter, not to the literal "1" —
            // which on a part-numbered book does not exist, so the old code's
            // recovery path was itself a dead end and reported "Book content not
            // found" for a book whose content was fine.
            const first = firstBodyChapterId();
            if (first !== null && chapterKey(chapterNum) !== chapterKey(first)) {
                alert(`Chapter ${chapterNum} not found. Returning to the start of the book.`);
                currentChapterNum = first;
                savedCharIndex = 0;
                loadChapter(first);
            } else {
                textStream.innerText = "Book content not found.";
            }
        }
    } catch (e) {
        console.error("loadChapter error:", e);
        // Show retry button — don't leave students on a dead screen
        textStream.innerHTML =
            '<div style="text-align:center; padding:40px; font-family:monospace;">' +
            '<div style="font-size:1.1rem; margin-bottom:16px;">Couldn\u2019t load this chapter.</div>' +
            '<div style="font-size:0.85rem; color:#888; margin-bottom:20px;">' + (e.message || 'Network or permission error') + '</div>' +
            '<button onclick="loadChapter(' + chapterNum + ')" ' +
            'style="padding:10px 24px; background:var(--carolina-blue); color:white; border:none; ' +
            'border-radius:4px; cursor:pointer; font-size:1rem; margin-right:10px;">Try Again</button>' +
            // Same fix as everywhere else: the start of the book, not the literal 1.
            '<button onclick="loadChapter(\'' + (firstBodyChapterId() || 1) + '\')" ' +
            'style="padding:10px 24px; background:#555; color:white; border:none; ' +
            'border-radius:4px; cursor:pointer; font-size:1rem;">Go to the start</button>' +
            '</div>';
    }
}

// Typeable character set: printable ASCII (space through tilde), tab, newline
// Anything outside this set gets replaced with a logical equivalent or removed.
const CHAR_REPLACEMENTS = {
    // Quotes & apostrophes
    '\u2018': "'", '\u2019': "'", '\u201A': "'",  // single curly quotes
    '\u201C': '"', '\u201D': '"', '\u201E': '"',  // double curly quotes
    '\u2039': "'", '\u203A': "'",                  // single angle quotes
    '\u00AB': '"', '\u00BB': '"',                  // guillemets
    '\u02BC': "'",                                  // modifier letter apostrophe
    '\u2032': "'", '\u2033': '"',                  // prime, double prime

    // Dashes & hyphens
    '\u2013': '-',  // en dash
    '\u2014': '--', // em dash
    '\u2015': '--', // horizontal bar
    '\u2012': '-',  // figure dash
    '\u2010': '-',  // hyphen
    '\u2011': '-',  // non-breaking hyphen
    '\u00AD': '',   // soft hyphen (invisible, just remove)

    // Dots & ellipsis
    '\u2026': '...', // ellipsis
    '\u2022': '-',   // bullet
    '\u2023': '-',   // triangular bullet
    '\u2027': '-',   // hyphenation point
    '\u00B7': '.',   // middle dot

    // Spaces
    '\u00A0': ' ',   // non-breaking space
    '\u2002': ' ',   // en space
    '\u2003': ' ',   // em space
    '\u2004': ' ',   // three-per-em space
    '\u2005': ' ',   // four-per-em space
    '\u2006': ' ',   // six-per-em space
    '\u2007': ' ',   // figure space
    '\u2008': ' ',   // punctuation space
    '\u2009': ' ',   // thin space
    '\u200A': ' ',   // hair space
    '\u202F': ' ',   // narrow no-break space
    '\u205F': ' ',   // medium mathematical space

    // Invisible / zero-width (just remove)
    '\u200B': '', // zero-width space
    '\u200C': '', // zero-width non-joiner
    '\u200D': '', // zero-width joiner
    '\u200E': '', // left-to-right mark
    '\u200F': '', // right-to-left mark
    '\uFEFF': '', // byte-order mark / zero-width no-break space
    '\u2060': '', // word joiner
    '\u00AD': '', // soft hyphen

    // Ligatures
    '\u00C6': 'AE', '\u00E6': 'ae', // Æ æ
    '\u0152': 'OE', '\u0153': 'oe', // Œ œ
    '\u0132': 'IJ', '\u0133': 'ij', // Ĳ ĳ
    '\uFB00': 'ff', '\uFB01': 'fi', '\uFB02': 'fl', '\uFB03': 'ffi', '\uFB04': 'ffl',
    '\u00DF': 'ss', // ß (eszett)
    '\u00F0': 'd',  // ð (eth)
    '\u00FE': 'th', '\u00DE': 'Th', // þ Þ (thorn)

    // Symbols with logical replacements
    '\u00A9': '(c)',  // ©
    '\u00AE': '(R)',  // ®
    '\u2122': '(TM)', // ™
    '\u00B0': ' degrees', // ° (in prose: "90°" → "90 degrees")
    '\u00D7': 'x',    // × multiplication
    '\u00F7': '/',    // ÷ division
    '\u2212': '-',    // minus sign
    '\u00B1': '+/-',  // ±
    '\u00BC': '1/4',  // ¼
    '\u00BD': '1/2',  // ½
    '\u00BE': '3/4',  // ¾
    '\u2153': '1/3',  // ⅓
    '\u2154': '2/3',  // ⅔

    // Currency
    '\u00A2': 'cents',  // ¢
    '\u00A3': 'GBP ',   // £
    '\u00A5': 'JPY ',   // ¥
    '\u20AC': 'EUR ',   // €

    // Misc punctuation
    '\u2020': '*',  // † dagger
    '\u2021': '**', // ‡ double dagger
    '\u00A7': 'S.',  // § section sign
    '\u00B6': '',    // ¶ pilcrow (remove)
    '\u2016': '||',  // ‖ double vertical line
    '\u2044': '/',   // ⁄ fraction slash
};

function sanitizeText(text) {
    // 1. Apply explicit replacements
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch in CHAR_REPLACEMENTS) {
            result += CHAR_REPLACEMENTS[ch];
        } else {
            result += ch;
        }
    }

    // 2. Normalize accented characters → base letters (é→e, ñ→n, etc.)
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 3. Remove anything still outside typeable ASCII + tab + newline
    result = result.replace(/[^ -~\t\n]/g, '');

    // 4. Clean up artifacts: multiple spaces, spaces before punctuation
    result = result.replace(/ {2,}/g, ' ');

    return result;
}

function setupGame() {
    fullText = bookData.segments.map(s => s.text).join("\n");
    fullText = sanitizeText(fullText);

    renderText();
    currentCharIndex = savedCharIndex;
    // Every chapter/book/practice load re-anchors the sprint and clears any
    // stale hard-stop flag. Position warps that skipped startGame() could
    // otherwise leave sprintCharStart pointing into a different text — the
    // root of the impossible leaderboard WPMs.
    sprintCharStart = currentCharIndex;
    isHardStop = false;

    if (currentCharIndex > 0) {
        for (let i = 0; i < currentCharIndex; i++) {
            const el = document.getElementById(`char-${i}`);
            if (el) {
                el.classList.remove('active');
                if (!el.classList.contains('space') && !el.classList.contains('enter') && !el.classList.contains('tab')) {
                    el.classList.add('done-perfect');
                }
            }
        }
    }

    highlightCurrentChar();
    centerView();

    accDisplay.innerText = "---"; wpmDisplay.innerText = "0";
    // Render the timer with its real value rather than a hardcoded "00:00".
    // For a kid in Day-goal mode loading the page, this shows their accumulated
    // daily time immediately instead of leaving them at 00:00 until they start
    // typing. Note that on first call from the auth handler, statsData hasn't
    // loaded yet, so this renders zero — but loadUserStats() in init() calls
    // updateTimerUI() again after stats arrive, fixing the display.
    updateTimerUI();

    // ─── Adventure: notify renderer that a chapter is loaded ───
    emitTextLoaded();

    let btnLabel = "Resume";
    if (savedCharIndex === 0) btnLabel = "Start Reading";
    lastStartBtnLabel = btnLabel;

    if (autoStartNext) {
        autoStartNext = false;
        startGame();
    } else if (!isGameActive) {
        showStartModal(btnLabel);
        // Fire-and-forget. The splash is an overlay above the modal, so it
        // doesn't matter whether the start modal or the initials prompt ends
        // up underneath it — whichever wins is revealed when the splash closes.
        maybeShowViewSplash();
    }
}

function renderText() {
    // Every span is about to be replaced, so the tracked .active element and the
    // cached container height are both stale from this line onward.
    resetActiveLetterTracking();
    textStream.innerHTML = '';
    const container = document.createDocumentFragment();
    let wordBuffer = document.createElement('span');
    wordBuffer.className = 'word';

    for (let i = 0; i < fullText.length; i++) {
        const char = fullText[i];
        if (char === '\n') {
            const span = document.createElement('span');
            span.className = 'letter enter'; span.innerHTML = '&nbsp;'; span.id = `char-${i}`;
            wordBuffer.appendChild(span);
            container.appendChild(wordBuffer);
            container.appendChild(document.createElement('br'));
            wordBuffer = document.createElement('span'); wordBuffer.className = 'word';
        } else if (char === ' ') {
            const span = document.createElement('span');
            span.className = 'letter space'; span.innerText = ' '; span.id = `char-${i}`;
            wordBuffer.appendChild(span);
            container.appendChild(wordBuffer);
            wordBuffer = document.createElement('span'); wordBuffer.className = 'word';
        } else if (char === '\t') {
            if (wordBuffer.hasChildNodes()) { container.appendChild(wordBuffer); wordBuffer = document.createElement('span'); wordBuffer.className = 'word'; }
            const tabSpan = document.createElement('span'); tabSpan.className = 'word';
            const span = document.createElement('span'); span.className = 'letter tab'; span.innerHTML = '&nbsp;'; span.id = `char-${i}`;
            tabSpan.appendChild(span); container.appendChild(tabSpan);
        } else {
            const span = document.createElement('span'); span.className = 'letter'; span.innerText = char; span.id = `char-${i}`;
            wordBuffer.appendChild(span);
        }
    }
    if (wordBuffer.hasChildNodes()) container.appendChild(wordBuffer);
    textStream.appendChild(container);
}

function startGame() {
    const select = document.getElementById('sprint-select');
    if (select) {
        sessionValueStr = select.value;
        sessionLimit = (sessionValueStr === 'infinity') ? 'infinity' : parseInt(sessionValueStr);
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
    }

    sprintSeconds = 0; sprintMistakes = 0; sprintCharStart = currentCharIndex;
    activeSeconds = 0; timeAccumulator = 0; lastInputTime = Date.now();
    consecutiveMistakes = 0; backspaceOrigin = -1; mistakesAtCurrent = 0;
    currentStreak = 0; streakMilestone = 0;
    updateStreak(false); // reset display
    wpmHistory = []; accuracyHistory = [];

    highlightCurrentChar(); centerView(); closeModal();
    isGameActive = true; isOvertime = false; isHardStop = false;
    accDisplay.innerText = "100%"; wpmDisplay.innerText = "0";
    timerDisplay.style.color = 'white'; timerDisplay.style.opacity = '1';

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(gameTick, 100);
}

function gameTick() {
    if (!isGameActive) return;
    const now = Date.now();

    // AUTO PAUSE FOR INACTIVITY - treat as full break (logs time, shows stats, practice option)
    if (now - lastInputTime > AFK_THRESHOLD && !isModalOpen && !ggBypassIdle) {
        if (currentCharIndex >= fullText.length) { finishChapter(); return; }
        pauseGameForBreak();
        return;
    }

    if (now - lastInputTime < IDLE_THRESHOLD) {
        timeAccumulator += 100;
        timerDisplay.style.opacity = '1';
        if (timeAccumulator >= 1000) {
            activeSeconds++; sprintSeconds++;

            // Midnight rollover check
            const todayStr = getLocalDateStr();
            if (statsData.lastDate && statsData.lastDate !== todayStr) {
                console.log(`Day rolled over: ${statsData.lastDate} → ${todayStr}. Resetting daily stats.`);
                statsData.secondsToday = 0;
                statsData.charsToday = 0;
                statsData.mistakesToday = 0;
                statsData.lastDate = todayStr;
                dailyGoalCelebrated = false; // eligible for today's goal
                // Check week rollover too
                const weekStart = getWeekStart(new Date());
                if (statsData.weekStart !== weekStart) {
                    statsData.secondsWeek = 0;
                    statsData.charsWeek = 0;
                    statsData.mistakesWeek = 0;
                    statsData.weekStart = weekStart;
                    weeklyGoalCelebrated = false;
                }
            }

            statsData.secondsToday++; statsData.secondsWeek++;
            timeAccumulator -= 1000;
            updateTimerUI();

            // ─── Adventure: heartbeat stats ───
            _ttbEmit('stats', {
                wpm: parseInt(wpmDisplay.innerText) || 0,
                accuracy: parseInt(accDisplay.innerText) || 100,
                activeSeconds: activeSeconds,
                sprintSeconds: sprintSeconds,
                secondsToday: statsData.secondsToday,
                secondsWeek: statsData.secondsWeek,
                streak: currentStreak,
                position: currentCharIndex,
            });

            // Goal celebrations
            if (goals.dailySeconds > 0 && !dailyGoalCelebrated && statsData.secondsToday >= goals.dailySeconds) {
                dailyGoalCelebrated = true;
                launchConfetti();
            }
            if (goals.weeklySeconds > 0 && !weeklyGoalCelebrated && statsData.secondsWeek >= goals.weeklySeconds) {
                weeklyGoalCelebrated = true;
                launchFireworks();
            }

            // Anonymous infinite-mode login reminders (based on total typing time)
            if (sessionLimit === 'infinity' && (!currentUser || currentUser.isAnonymous)) {
                const totalTyped = anonTotalSeconds + sprintSeconds;
                if (anonInfiniteReminders === 0 && totalTyped >= ANON_INFINITE_REMINDER_1) {
                    anonInfiniteReminders = 1;
                    saveAnonReminderState();
                    showAnonInfiniteReminder();
                    return;
                }
                if (anonInfiniteReminders === 1 && totalTyped >= ANON_INFINITE_REMINDER_2) {
                    anonInfiniteReminders = 2;
                    saveAnonReminderState();
                    showAnonInfiniteReminder();
                    return;
                }
            }
        }
    } else {
        timerDisplay.style.opacity = '0.5';
        wpmDisplay.innerText = "0";
        wpmHistory = [];
    }
}

function updateTimerUI() {
    // Default: session "Active" time. When the user has a daily goal set, the
    // top-bar timer should instead show their accumulated typing time for the
    // day (statsData.secondsToday) — that's what the "/ 8:00" denominator
    // refers to. Showing activeSeconds (which resets on every startGame) made
    // the numerator wrong and confused kids whose Day display was lower than
    // what the pause modal showed.
    let displaySeconds;
    if (sessionLimit !== 'infinity') {
        displaySeconds = activeSeconds;          // sprint countdown — session time
    } else if (goals.dailySeconds > 0) {
        displaySeconds = statsData.secondsToday; // Day mode — total daily time
    } else {
        displaySeconds = activeSeconds;          // Active fallback — session time
    }
    const mins = Math.floor(displaySeconds / 60).toString().padStart(2, '0');
    const secs = (displaySeconds % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${mins}:${secs}`;
    if (sessionLimit !== 'infinity' && sprintSeconds >= sessionLimit) {
        isOvertime = true;
        timerDisplay.style.color = '#FFA500';
    }

    // Label and goal denominator
    const labelEl = document.getElementById('timer-label');
    const goalEl  = document.getElementById('timer-goal');
    if (labelEl && goalEl) {
        if (sessionLimit !== 'infinity') {
            const gm = Math.floor(sessionLimit / 60).toString().padStart(2, '0');
            const gs = (sessionLimit % 60).toString().padStart(2, '0');
            labelEl.textContent = 'Sprint';
            labelEl.style.color = '';
            goalEl.textContent  = '\u00a0/ ' + gm + ':' + gs;
        } else if (goals.dailySeconds > 0) {
            const gm = Math.floor(goals.dailySeconds / 60).toString().padStart(2, '0');
            const gs = (goals.dailySeconds % 60).toString().padStart(2, '0');
            const done = statsData.secondsToday >= goals.dailySeconds;
            labelEl.textContent = done ? '\u2713\u00a0Day' : 'Day';
            labelEl.style.color = done ? '#22c55e' : '';
            goalEl.textContent  = '\u00a0/ ' + gm + ':' + gs;
        } else {
            labelEl.textContent = 'Active';
            labelEl.style.color = '';
            goalEl.textContent  = '';
        }
    }
    const hudWeekEl = document.getElementById('hud-week');
    if (hudWeekEl) {
        const wm = Math.floor(statsData.secondsWeek / 60);
        const ws = statsData.secondsWeek % 60;
        let txt = 'Week\u00a0' + wm + ':' + String(ws).padStart(2, '0');
        if (goals.weeklySeconds > 0) {
            const gm = Math.floor(goals.weeklySeconds / 60);
            const gs = goals.weeklySeconds % 60;
            txt += '\u00a0/\u00a0' + gm + ':' + String(gs).padStart(2, '0');
        }
        if (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds) txt += '\u00a0\u2713';
        hudWeekEl.textContent = txt;
    }
}

function updateRunningWPM() {
    const now = Date.now();
    wpmHistory.push(now);
    if (wpmHistory.length > 20) wpmHistory.shift();
    if (wpmHistory.length > 1) {
        const timeDiffMs = now - wpmHistory[0];
        const timeDiffMin = timeDiffMs / 60000;
        const chars = wpmHistory.length - 1;
        if (timeDiffMin > 0) {
            const wpm = Math.round((chars / 5) / timeDiffMin);
            wpmDisplay.innerText = wpm;
        }
    }
}

function updateRunningAccuracy(isCorrect) {
    accuracyHistory.push(isCorrect ? 1 : 0);
    if (accuracyHistory.length > 50) accuracyHistory.shift();
    const correctCount = accuracyHistory.filter(val => val === 1).length;
    const total = accuracyHistory.length;
    if (total > 0) accDisplay.innerText = Math.round((correctCount / total) * 100) + "%";
}

function updateStreak(correct) {
    if (correct) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        // Check milestones: 25, 50, 100, 200, 500
        const milestones = [25, 50, 100, 200, 500];
        for (const m of milestones) {
            if (currentStreak === m && m > streakMilestone) {
                streakMilestone = m;
                streakDisplay.classList.add('streak-pop');
                setTimeout(() => streakDisplay.classList.remove('streak-pop'), 300);
                break;
            }
        }
    } else {
        currentStreak = 0;
    }
    // Update display
    streakDisplay.textContent = `🔥 ${currentStreak}`;
    streakDisplay.className = currentStreak >= 100 ? 'streak-fire' :
                              currentStreak >= 50  ? 'streak-hot' :
                              currentStreak >= 25  ? 'streak-warm' : 'streak-cold';
}

document.addEventListener('keydown', (e) => {
    // Caps Lock detection
    if (e.getModifierState && e.key !== 'CapsLock') {
        const capsOn = e.getModifierState('CapsLock');
        document.getElementById('caps-warning').classList.toggle('hidden', !capsOn);
    } else if (e.key === 'CapsLock') {
        // CapsLock key itself — state flips AFTER the event in some browsers,
        // so we toggle based on current state
        const capsWarning = document.getElementById('caps-warning');
        const wasOn = e.getModifierState('CapsLock');
        // If it was on, pressing CapsLock turns it off, and vice versa
        capsWarning.classList.toggle('hidden', wasOn);
    }

    if (isModalOpen) {
        if (isInputBlocked) return;

        // --- HARD STOP / PAUSE LOGIC ---
        if (isHardStop) {
            let targetChar = fullText[currentCharIndex];
            let isMatch = (e.key === targetChar);
            if (targetChar === '\n' && e.key === 'Enter') isMatch = true;
            if (targetChar === '\t' && e.key === 'Tab') isMatch = true;

            if (isMatch) {
                resumeGame();
                handleTyping(e.key);
            }
            return;
        }

        // --- SMART START LOGIC ---
        // Skip if user is typing in an input/select (e.g. Game Genie fields)
        const activeTag = e.target && e.target.tagName;
        if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') return;

        let shouldStart = false;
        let shouldSkip = false;

        const targetChar = fullText[currentCharIndex];

        // End-of-chapter modal: ANY of Enter, Space, or a printable key advances
        // to the next chapter. Kids don't always read the "Press Enter" hint —
        // making this lenient avoids the "I'm typing but nothing happens" bug
        // where they sit on the last character thinking the modal is stuck.
        // Tab and modifier keys are excluded so accidental Tab-to-focus or
        // Shift-Caps doesn't fast-forward.
        // 400ms grace period: a fast typist's in-flight keystrokes right after
        // the last character would otherwise blow through the stats modal
        // before they could read it.
        if (currentCharIndex >= fullText.length && modalActionCallback &&
            Date.now() - chapterCompleteAt >= 400) {
            const isContinueKey =
                e.key === 'Enter' ||
                e.key === ' ' ||
                (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey);
            if (isContinueKey) {
                e.preventDefault();
                const cb = modalActionCallback;
                modalActionCallback = null;
                cb();
                return;
            }
        }

        if (e.key === targetChar) shouldStart = true;
        if (targetChar === '\n' && e.key === 'Enter') shouldStart = true;
        if (targetChar === '\t' && e.key === 'Tab') shouldStart = true;

        if (!shouldStart && (targetChar === ' ' || targetChar === '\n')) {
            const nextCharIndex = currentCharIndex + 1;
            if (nextCharIndex < fullText.length) {
                const nextChar = fullText[nextCharIndex];
                if (e.key === nextChar) { shouldStart = true; shouldSkip = true; }
                else if (nextChar === '\t' && e.key === 'Tab') { shouldStart = true; shouldSkip = true; }
            }
        }

        if (shouldStart && modalActionCallback) {
            e.preventDefault();
            modalActionCallback();
            if (shouldSkip) {
                const skippedEl = document.getElementById(`char-${currentCharIndex}`);
                if(skippedEl) skippedEl.classList.add('done-perfect');
                currentCharIndex++;
            }
            handleTyping(e.key);
            return;
        }
        return;
    }

    if (e.key === "Escape" && isGameActive) { pauseGameForBreak(); return; }
    if (e.key === "Shift") toggleKeyboardCase(true);
    if (!isGameActive) return;
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
    // ⚠️ CANCEL THE DEFAULT FOR EVERY KEY WE CONSUME. (v3.9.3)
    //
    // This listener is on `document`, not on an input, so nothing absorbs the
    // keystroke for us — and only space, Tab and Enter used to be cancelled.
    // Every other printable character was handled here AND handed to the browser.
    //
    // On FIREFOX that is not cosmetic. Firefox still ships Quick Find, the
    // type-ahead-find feature it inherited from Netscape: `/` opens Quick Find and
    // `'` opens Quick Find (links only). Apostrophes are in every contraction and
    // possessive, so a student typing "don't" or "Toby's" popped the find bar
    // several times per paragraph. Chrome never implemented type-ahead find, which
    // is why this was invisible at school and broken at home.
    //
    // e.key.length === 1 catches every printable character while leaving named
    // keys (F5, ArrowLeft, Escape) alone. The modifier guard is load-bearing:
    // without it we would swallow Ctrl+R, Ctrl+T and Cmd+Tab and trap the kid in
    // the tab. Backspace is included because handleTyping() consumes it and
    // Firefox historically navigated BACK on it outside a text field — that pref
    // ships off now, but a school image can flip it and cancelling costs nothing.
    if (!e.ctrlKey && !e.metaKey && !e.altKey &&
        (e.key.length === 1 || e.key === "Tab" || e.key === "Enter" ||
         e.key === "Backspace")) {
        e.preventDefault();
    }
    handleTyping(e.key);
});

function handleTyping(key) {
    lastInputTime = Date.now();
    timerDisplay.style.opacity = '1';

    let inputChar = key;
    if (key === "Tab") inputChar = "\t";
    if (key === "Enter") inputChar = "\n";

    const targetChar = fullText[currentCharIndex];
    const currentEl = document.getElementById(`char-${currentCharIndex}`);

    if (key === "Backspace") {
        if (mistakesAtCurrent > 0) {
            // Undo ONE mistake at the current letter. The cursor stays put
            // until every mistake here has been backspaced away — like
            // deleting real mistyped characters one by one.
            mistakesAtCurrent--;
            currentLetterStatus = 'fixed';
            if (backspaceOrigin < 0) backspaceOrigin = currentCharIndex;
            applyMissShade(currentEl, mistakesAtCurrent);
            if (mistakesAtCurrent === 0 && currentEl) currentEl.classList.remove('error-state');
            _ttbEmit('backspaceUndo', { position: currentCharIndex, remaining: mistakesAtCurrent });
        } else if (currentCharIndex > sprintCharStart) {
            // Additional backspaces: move back to previous char
            if (backspaceOrigin < 0) backspaceOrigin = currentCharIndex;
            currentCharIndex--;
            currentLetterStatus = 'fixed';
            const prevEl = document.getElementById(`char-${currentCharIndex}`);
            if (prevEl) {
                prevEl.classList.remove('done-perfect', 'done-fixed', 'done-dirty');
                prevEl.classList.add('active');
            }
            // Un-highlight the char we just left
            if (currentEl) currentEl.classList.remove('active');
            highlightCurrentChar(); centerView();
            _ttbEmit('positionSet', { position: currentCharIndex });
        }
        return;
    }

    if (inputChar === targetChar) {
        statsData.charsToday++; statsData.charsWeek++;
        anonCharsTyped++;
        consecutiveMistakes = 0;

        currentEl.classList.remove('active'); currentEl.classList.remove('error-state');
        currentEl.style.removeProperty('background-color');
        mistakesAtCurrent = 0;
        if (currentLetterStatus === 'clean') currentEl.classList.add('done-perfect');
        else if (currentLetterStatus === 'fixed') currentEl.classList.add('done-fixed');
        else currentEl.classList.add('done-dirty');

        currentCharIndex++;
        // Keep 'fixed' status until we pass the backspace origin point
        if (backspaceOrigin >= 0 && currentCharIndex <= backspaceOrigin) {
            currentLetterStatus = 'fixed';
        } else {
            backspaceOrigin = -1;
            currentLetterStatus = 'clean';
        }

        _ttbEmit('keystroke', {
            correct: true,
            char: inputChar,
            position: currentCharIndex,
            // status was just decided above for the just-completed char at
            // currentCharIndex - 1. Tell the renderer so it can paint that
            // letter in the appropriate color.
            statusAtCompleted: (currentEl && currentEl.classList.contains('done-perfect')) ? 'perfect' :
                                (currentEl && currentEl.classList.contains('done-fixed'))   ? 'fixed' :
                                                                                             'dirty',
            completedPos: currentCharIndex - 1,
        });

        // Was saveProgress() — three Firestore writes per sentence. Now records
        // to the local write-ahead log and lets the flush timer batch it.
        if (['.', '!', '?', '\n'].includes(targetChar)) markDirty();
        else if (['"', "'"].includes(targetChar) && currentCharIndex >= 2) {
            const prevChar = fullText[currentCharIndex - 2];
            if (['.', '!', '?'].includes(prevChar)) markDirty();
        }

        updateRunningWPM(); updateRunningAccuracy(true); updateStreak(true);

        if (currentCharIndex >= fullText.length) { finishChapter(); return; }

        if (isOvertime) {
            // Don't stop near end of chapter — let them finish it
            const remaining = fullText.length - currentCharIndex;
            if (remaining > 200 && ['.', '!', '?', '\n'].includes(targetChar)) {
                const nextChar = fullText[currentCharIndex];
                if (nextChar !== '"' && nextChar !== "'") { triggerStop(); return; }
            }
        }

        flashFingerPressed();
        highlightCurrentChar(); centerView();
    } else {
        mistakes++; sprintMistakes++;
        consecutiveMistakes++;
        anonMistakes++;

        statsData.mistakesToday++; statsData.mistakesWeek++;
        if (currentLetterStatus === 'clean') currentLetterStatus = 'error';
        mistakesAtCurrent++;
        const errEl = document.getElementById(`char-${currentCharIndex}`);
        if(errEl) { errEl.classList.add('error-state'); applyMissShade(errEl, mistakesAtCurrent); }
        flashKey(key); updateRunningAccuracy(false); updateStreak(false);

        // Track missed characters
        const missKey = targetChar === ' ' ? 'Space' : targetChar === '\n' ? 'Enter' : targetChar;
        if (missKey) missedCharsMap[missKey] = (missedCharsMap[missKey] || 0) + 1;

        _ttbEmit('keystroke', {
            correct: false,
            char: inputChar,
            expected: targetChar,
            position: currentCharIndex,
        });

        if (consecutiveMistakes >= SPAM_THRESHOLD && !ggAllowMistakes) {
            triggerHardStop(targetChar, false);
        }
    }
}

function triggerStop() {
    updateImageDisplay(); highlightCurrentChar(); centerView(); pauseGameForBreak();
}

function triggerHardStop(targetChar, isAfk) {
    isGameActive = false;
    clearInterval(timerInterval);
    isHardStop = true;
    resetModalFooter();

    // Roll back to the start of the current sentence — but ONLY in adventure
    // mode. Adventure has a visible figure that needs somewhere to respawn,
    // and the rollback feels narratively right (death → restart sentence). In
    // classic mode there's no figure, so the rollback would feel unfair —
    // keep the original behavior (modal waits for the failed-letter to
    // resume, no rollback).
    const failPos = currentCharIndex;
    let sentenceStart = failPos;

    if (VIEW_MODE === 'adventure') {
        sentenceStart = findSentenceStartFor(failPos);

        // Walk the per-letter DOM nodes and reset them to clean (re-typable)
        // state. game.js uses id="char-N" with classes done-perfect/done-fixed/
        // done-dirty/error-state/active.
        for (let i = sentenceStart; i <= failPos; i++) {
            const el = document.getElementById(`char-${i}`);
            if (!el) continue;
            el.classList.remove('done-perfect', 'done-fixed', 'done-dirty', 'error-state', 'active');
            el.style.removeProperty('background-color');
        }
        mistakesAtCurrent = 0;
        currentCharIndex = sentenceStart;
        highlightCurrentChar();
        centerView();
    }

    _ttbEmit('fail', {
        reason: isAfk ? 'afk' : 'spam',
        position: failPos,                  // where they died
        sentenceStart: sentenceStart,       // where they'll respawn (== failPos in classic)
        expected: targetChar,                // the letter that killed them
    });

    // Modal display: in adventure the resume gate now wants the sentence-start
    // letter (since we rolled back). In classic, we never rolled back, so the
    // failed letter is still what they need to type.
    if (VIEW_MODE === 'adventure') {
        targetChar = fullText[sentenceStart] || '?';
    }

    if (!targetChar) targetChar = '?';
    let friendlyKey = targetChar;
    if (targetChar === ' ') friendlyKey = 'Space';
    if (targetChar === '\n') friendlyKey = 'Enter';
    if (targetChar === '\t') friendlyKey = 'Tab';

    let hintHtml = "";
    if (friendlyKey.length === 1 && friendlyKey.match(/[A-Z]/)) {
        hintHtml = `<div class="modal-hint-text">(Requires Shift)</div>`;
    }

    setModalTitle(isAfk ? "Session Paused (Inactive)" : "Pausing for Accuracy");

    let msg = isAfk ? "You've been away for a while." : "Too many errors!";

    let statsHtml = '';
    if (isAfk) {
        const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
        const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
        const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
        const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);
        if (statsData.secondsToday > 0 || statsData.secondsWeek > 0) {
            statsHtml = `
                <div class="cumulative-row" style="margin-top:10px;">
                    <span>Today: ${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)</span>
                    <span>Week: ${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)</span>
                </div>
                ${getGoalProgressHTML()}
            `;
        }
    }

    document.getElementById('modal-body').innerHTML = `
        <div style="font-size: 1.1em;">
            ${msg}<br>
            Please type <b style="color: #D32F2F; font-size: 1.5em; border: 1px solid #ccc; padding: 2px 8px; border-radius: 4px;">${escapeHtml(friendlyKey)}</b> to resume.
            ${hintHtml}
        </div>
        ${statsHtml}
    `;
    const btn = document.getElementById('action-btn');
    btn.style.display = 'none';
    showModalPanel();
    isModalOpen = true;
    isInputBlocked = false;
}

function resumeGame() {
    isModalOpen = false;
    isHardStop = false;
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('virtual-keyboard').classList.remove('hidden');
    isGameActive = true;
    timerInterval = setInterval(gameTick, 100);
    consecutiveMistakes = 0;
    mistakesAtCurrent = 0;
    lastInputTime = Date.now();

    _ttbEmit('respawn', { position: currentCharIndex });

    const keyboard = document.getElementById('virtual-keyboard');
    if(keyboard) keyboard.focus();
}

document.addEventListener('keyup', (e) => { if (e.key === "Shift") toggleKeyboardCase(false); });

// --- VIEW LOGIC ---

// ─── Chapter picker ───────────────────────────────────────────────────────────

// Below this many chapters a plain dropdown is faster than typing. Above it,
// scrolling 286 options to find one fable is not navigation.
const CHAPTER_FILTER_MIN = 25;

// ONE builder for every chapter dropdown. There were three, and they had drifted:
// the settings list rendered "✓ Ch. 4: Title" while the rebuild that runs after a
// book switch — repopulating the very same <select> — rendered "Chapter 4: Title"
// with no completion ticks. Switching books silently relabelled the list.
//
// `filter` matches the visible label (so it hits both number and title) or the
// bare chapter number. Returns the html plus a count, because the caller needs to
// tell the student "3 of 286" or "no matches".
function buildChapterOptions(selectedNum, filter, withCheck) {
    if (!bookMetadata || !bookMetadata.chapters || !bookMetadata.chapters.length) {
        return { html: '<option value="">\u2014</option>', count: 0, total: 0 };
    }
    const q = String(filter || '').trim().toLowerCase();

    // ⚠️ STUDENTS ARE OFFERED BODY CHAPTERS ONLY (v3.11.0).
    //
    // This used to list every document in the spine, so "Ch. 0.2" — the imprint,
    // the copyright page, the colophon — sat in the picker as something to type.
    // Which is why the only safe workflow was to DELETE front matter during
    // import, and that in turn deleted the copyright notice a Creative Commons
    // licence requires be kept intact. A UI default was quietly setting a legal
    // constraint.
    //
    // Now the matter class decides. Front and back matter stay in the book, where
    // the notice belongs, and never reach a student. If a preface or an author's
    // introduction IS worth typing — §B.7's point, and Baum's introduction is a
    // real example — flip it to Body with the button in admin staging (v3.19.0).
    // One switch, one meaning: body means typeable.
    const offer = bodyChapterList();
    const total = offer.length;
    let html = '', count = 0;

    // ⚠️ A PART-NUMBERED BOOK RESTARTS ITS CHAPTER NUMBERS (v3.12.4), and the label
    // logic below prefers the title whenever it begins with "chapter" — which
    // discards the id. So Heidi listed "Chapter 1" through "Chapter 14" and then
    // "Chapter 1" through "Chapter 9" again: twenty-three entries, fourteen of them
    // ambiguous. Treasure Island, Little Women and The War of the Worlds are all the
    // same shape. Jake hit it on the two-chapter fixture, where the picker showed
    // "Chapter 1" twice and there was no way to tell which was which.
    //
    // Only prefixed when the book actually HAS parts, so a novel's picker is
    // untouched. 0.x and 900.x are matter ids, not parts.
    const partOf = (id) => {
        const m = /^(\d+)\.\d+$/.exec(String(id).replace('chapter_', ''));
        if (!m) return null;
        const n = parseInt(m[1], 10);
        return (n === 0 || n === 900) ? null : n;
    };
    const partedBook = new Set(offer.map(c => partOf(c.id)).filter(x => x !== null)).size >= 2;

    offer.forEach((chap) => {
        const num  = String(chap.id).replace('chapter_', '');
        const tick = (withCheck !== false && completedChapters.has(num)) ? '\u2713 ' : '';
        const pt   = partedBook && partOf(chap.id) !== null
            ? `Pt ${partOf(chap.id)} \u00b7 ` : '';
        let label = `${tick}${pt}Ch. ${num}`;
        if (chap.title && chap.title != num) {
            label = String(chap.title).toLowerCase().startsWith('chapter')
                ? `${tick}${pt}${chap.title}`
                : `${tick}${pt}Ch. ${num}: ${chap.title}`;
        }
        if (q && num !== q && !label.toLowerCase().includes(q)) return;
        count++;
        const sel = (String(num) === String(selectedNum)) ? ' selected' : '';
        html += `<option value="${escapeHtml(num)}"${sel}>${escapeHtml(label)}</option>`;
    });

    if (!count) html = '<option value="">No chapters match</option>';
    return { html, count, total };
}

// Wires a filter box to a chapter <select>. Shared by Settings and the Game
// Genie so the behaviour — including Enter meaning "go" — can't diverge.
function wireChapterFilter(filterId, selectId, statusId, goId) {
    const f = document.getElementById(filterId);
    const s = document.getElementById(selectId);
    if (!f || !s) return;
    const status = statusId ? document.getElementById(statusId) : null;
    f.oninput = () => {
        const keep = s.value;
        const r = buildChapterOptions(keep, f.value);
        s.innerHTML = r.html;
        if (status) {
            status.textContent = !f.value.trim() ? ''
                : r.count ? `${r.count} of ${r.total}`
                          : 'no matches';
            status.style.color = (f.value.trim() && !r.count) ? '#D32F2F' : '#888';
        }
    };
    f.onkeydown = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const go = goId && document.getElementById(goId);
        if (go && s.value) go.click();
    };
}

// ─── Progress Bars ────────────────────────────────────────────────────────────

// Above this many chapters the per-chapter segment bar stops being either
// legible or affordable and we switch to a single condensed track.
//
// 40 is where a segment drops under ~7px on the shortest bar we render (a
// ~280px strip on a 768px Chromebook), which is about the floor for a divider
// plus fill to read as anything. Aesop is 286.
const BOOK_BAR_MAX_SEGMENTS = 40;
let bookBarCondensed = false;

function initBookProgressBar() {
    const track = document.getElementById('book-progress-track');
    if (!track || !bookMetadata || !bookMetadata.chapters) return;

    const chapters = bookMetadata.chapters;
    const total    = chapters.length;
    if (!total) return;

    // Built ONCE for the whole render, not once per segment: Aesop has 284
    // chapters and this used to be the hot loop the v3.6.0 audit went after.
    const _bpOrdinals = bodyOrdinalMap();
    const bodyTotal = bodyChapterList().length;

    track.innerHTML = '';
    bookBarCondensed = total > BOOK_BAR_MAX_SEGMENTS;

    if (bookBarCondensed) {
        // Three nodes, not 5×286. updateProgressBars() then costs three lookups
        // per keystroke instead of 1,144.
        track.innerHTML =
            '<div id="book-condensed-fill" class="book-condensed-fill"></div>' +
            '<div id="book-condensed-marker" class="book-condensed-marker"></div>';
        const lbl0 = document.getElementById('book-progress-label');
        // Body chapters, not every document in the spine — "290 ch" for Aesop
        // counted the colophon and the uncopyright page.
        if (lbl0) lbl0.textContent = bodyTotal + ' ch';
        updateProgressBars();
        return;
    }

    chapters.forEach((chap, i) => {
        const seg = document.createElement('div');
        seg.className  = 'book-chap-seg future';
        seg.id         = 'bps-' + chap.id;
        seg.style.cssText = 'position:absolute;left:0;right:0;' +
            'top:'    + (i / total * 100) + '%;' +
            'height:' + (1 / total * 100) + '%;';

        // Divider line between chapters
        if (i > 0) {
            const div = document.createElement('div');
            div.className = 'book-chap-divider';
            div.style.top = '0';
            seg.appendChild(div);
        }

        // Inner fill (progress within current chapter)
        const innerFill = document.createElement('div');
        innerFill.className = 'chap-inner-fill';
        innerFill.id = 'bpf-' + chap.id;
        seg.appendChild(innerFill);

        // Inner marker (glowing line at current position)
        const innerMarker = document.createElement('div');
        innerMarker.className = 'chap-inner-marker';
        innerMarker.id = 'bpm-' + chap.id;
        seg.appendChild(innerMarker);

        // Chapter number label (every chapter, shown on right side)
        // Ordinal among BODY chapters, so Heidi reads 1..23 instead of fourteen
        // segments all labelled "1". Front and back matter get no number — they
        // are not chapters and numbering them was how 0.1 became "0".
        const ord = _bpOrdinals.get(chapterKey(chap.id));
        const lbl = document.createElement('div');
        lbl.className = 'book-chap-label';
        lbl.textContent = (ord === undefined) ? '' : ord;
        lbl.style.top = '50%';
        seg.appendChild(lbl);

        track.appendChild(seg);
    });

    // ⚠️ SECOND SITE, MISSED IN v3.10.0 (fixed v3.12.3). The condensed bar's label
    // was switched to the body count and this one was not, so an uncondensed book
    // still advertised every spine document — "10 ch" for a two-chapter book.
    const lbl = document.getElementById('book-progress-label');
    if (lbl) lbl.textContent = bodyTotal + ' ch';

    updateProgressBars();
}

// Where we are through the whole book, 0..1. Chapters are treated as equal
// width — they aren't, but the metadata document holds no per-chapter length and
// reading 286 chapter documents to find out would cost more than the honesty is
// worth. Within the current chapter we interpolate by real character position,
// so the marker still moves smoothly as you type.
// ─── STOP DOING ARITHMETIC ON CHAPTER IDS (v3.10.0) ──────────────────────────
//
// Four places in this file did parseInt() on a chapter id. On the four
// part-numbered books — Heidi, Treasure Island, Little Women, The War of the
// Worlds — a chapter id looks like "1.14", and parseInt("1.14") is 1. So:
//
//   · every one of Heidi's fourteen part-one chapters was labelled "1" on the
//     book progress bar, and all nine part-two chapters were labelled "2";
//   · parseInt("1.01") === parseInt("1.14") is TRUE, so findIndex() matched the
//     FIRST chapter in the part rather than the one being read — the position
//     marker never left the start of part one;
//   · isCurrent was computed the same way, so THE WHOLE PART lit up as current
//     simultaneously, and isPast was wrong for the same reason.
//
// An id is a LABEL, not a number. Position comes from the chapter list, by exact
// string match. Same defect class as index.html v3.3.1 and as the comparator
// admin.js fixed in v3.17.0 — third appearance in the project.
function chapterKey(id) {
    return String(id === undefined || id === null ? '' : id).replace(/^chapter_/, '');
}

// The body chapters, in order. Two fallbacks, because the data is not uniform:
//
//   · admin.js v3.19.1+ writes `matter` on every chapter — use it;
//   · older documents have no `matter` at all, so fall back to the ID CONVENTION
//     that assignChapterIds() established: front matter is 0.x, back matter is
//     900.x. Without this fallback an old book's front matter would count as
//     body chapter 1 and shift every ordinal, which is worse than the bug;
//   · a book with no body chapters at all (shouldn't happen) returns everything
//     rather than an empty bar.
function bodyChapterList() {
    const all = (bookMetadata && bookMetadata.chapters) ? bookMetadata.chapters : [];
    if (!all.length) return all;
    let body;
    if (all.some(c => c && c.matter)) {
        body = all.filter(c => (c.matter || 'body') === 'body');
    } else {
        body = all.filter(c => {
            const k = chapterKey(c.id);
            return !/^0\./.test(k) && !/^900\./.test(k);
        });
    }
    return body.length ? body : all;
}

// ─── THE FIRST CHAPTER IS NOT NECESSARILY CALLED "1" (v3.12.1) ───────────────
//
// Opening a book with no saved progress hardcoded currentChapterNum = 1 and
// called loadChapter(1). On a PART-NUMBERED book the first chapter is "1.01", so
// chapter_1 does not exist and the reader gets "Book content not found." or, in
// Adventure mode, a blank page with a stick figure and no text.
//
// ⚠️ THIS WAS NOT INTRODUCED BY THE TEST FIXTURE. It has been true for Heidi,
// Treasure Island, Little Women and The War of the Worlds since part numbering
// shipped in admin.js v3.14.0 — any student opening one of those four for the
// FIRST time got a blank book. It went unnoticed because the four were only ever
// opened by someone who already had progress stored.
//
// Sixth appearance of "the id is not a number" in this project.
function firstBodyChapterId() {
    const list = bodyChapterList();
    if (!list.length) return null;
    return String(list[0].id).replace(/^chapter_/, '');
}

// ⚠️ RENUMBER PROTECTION. Fix C (admin.js v3.18.5) changes chapter ids on the
// Gutenberg books — Toby Tyler goes from 3-22 to 1-20. A student whose stored
// progress points at chapter_22 would ask for a chapter the re-imported book no
// longer has. Validating the stored id against the book turns that from a dead
// end into a nudge back to the start.
function isKnownBodyChapter(id) {
    const k = chapterKey(id);
    return bodyChapterList().some(c => chapterKey(c.id) === k);
}

// key -> 1-based ordinal among body chapters. Built once per caller, not once
// per chapter: Aesop has 284 of them and this runs on every progress repaint.
function bodyOrdinalMap() {
    const m = new Map();
    bodyChapterList().forEach((c, i) => m.set(chapterKey(c.id), i + 1));
    return m;
}

function bookProgressFraction() {
    const chapters = bodyChapterList();
    if (!chapters.length) return 0;
    const key = chapterKey(currentChapterNum);
    const idx = chapters.findIndex(c => chapterKey(c.id) === key);
    // Reading front or back matter: not on the body track, so report no movement
    // rather than snapping the marker to the start.
    if (idx < 0) return 0;
    const within = (fullText && fullText.length)
        ? Math.min(1, currentCharIndex / fullText.length) : 0;
    return (idx + within) / chapters.length;
}

function updateProgressBars() {
    if (!fullText || !fullText.length) return;
    const pct = (currentCharIndex / fullText.length) * 100;

    // ── Left bar: progress through current chapter ────────────────────────────
    const fill   = document.getElementById('chapter-progress-fill');
    const marker = document.getElementById('chapter-progress-marker');
    const clabel = document.getElementById('chapter-progress-label');
    if (fill)   fill.style.height   = Math.min(100, pct) + '%';
    if (marker) marker.style.top    = Math.min(100, pct) + '%';
    if (clabel) clabel.textContent  = Math.round(pct) + '%';

    // ── Right bar: whole book ─────────────────────────────────────────────────
    if (!bookMetadata || !bookMetadata.chapters) return;

    if (bookBarCondensed) {
        const bookPct = bookProgressFraction() * 100;
        const cf = document.getElementById('book-condensed-fill');
        const cm = document.getElementById('book-condensed-marker');
        if (cf) cf.style.height = bookPct + '%';
        if (cm) cm.style.top    = bookPct + '%';
        const lbl2 = document.getElementById('book-progress-label');
        if (lbl2) {
            const o = bodyOrdinalMap().get(chapterKey(currentChapterNum));
            const t = bodyChapterList().length;
            // Falls back to the raw id when the reader is in front/back matter,
            // which is honest: "Ch 0.1 / 23" beats inventing a position.
            lbl2.textContent = 'Ch ' + (o === undefined ? currentChapterNum : o) + ' / ' + t;
        }
        return;
    }

    const ordinals = bodyOrdinalMap();
    const curOrd = ordinals.get(chapterKey(currentChapterNum));
    bookMetadata.chapters.forEach((chap) => {
        const ord = ordinals.get(chapterKey(chap.id));
        // Compared by POSITION, not by parsing the label. parseInt("1.01") and
        // parseInt("1.14") are both 1, which is why an entire part used to render
        // as current at once.
        const isCurrent = ord !== undefined && curOrd !== undefined && ord === curOrd;
        const isPast    = ord !== undefined && curOrd !== undefined && ord <  curOrd;

        const seg   = document.getElementById('bps-' + chap.id);
        const bfill = document.getElementById('bpf-' + chap.id);
        const bmark = document.getElementById('bpm-' + chap.id);
        if (!seg) return;

        seg.className = 'book-chap-seg ' +
            (isPast ? 'completed' : isCurrent ? 'current' : 'future');

        if (bfill) bfill.style.height = isPast ? '100%' : isCurrent ? Math.min(100, pct) + '%' : '0%';
        if (bmark) {
            bmark.style.display = isCurrent ? '' : 'none';
            bmark.style.top     = Math.min(100, pct) + '%';
        }

        // Highlight active chapter label
        const lbl = seg.querySelector('.book-chap-label');
        if (lbl) lbl.className = 'book-chap-label' + (isCurrent ? ' active-label' : '');
    });
}

// ⚠️ PER-KEYSTROKE HOT PATH. Everything below runs on every single character a
// student types, so a wasted DOM operation here is paid 300-400 times a minute
// per student. Two things were costing real frames on low-end hardware:
//
//   1. highlightCurrentChar() ran document.querySelectorAll('.letter.active')
//      — a full-document scan across ~8,000 spans — on every keystroke. Worse,
//      handleTyping() had ALREADY removed .active from the current element three
//      lines earlier, so the scan reliably walked eight thousand elements to
//      find nothing. We know which element it was; track it.
//
//   2. centerView() read container.clientHeight and currentEl.offsetTop
//      immediately after a class mutation, forcing a synchronous layout, then
//      wrote a transform — which invalidates layout again for the next
//      keystroke. Textbook layout thrash.
//
// The container height only changes on resize, so it's cached. offsetTop still
// has to be read (it depends on where the character wrapped to), but the read
// and the write are now batched into one rAF so a burst of fast keystrokes
// collapses into a single layout pass per frame instead of one per character.

let _activeLetterEl = null;         // the element currently wearing .active
let _cachedContainerHeight = 0;
let _centerRaf = 0;

function invalidateContainerHeight() { _cachedContainerHeight = 0; }
window.addEventListener('resize', invalidateContainerHeight);

function centerView() {
    if (_centerRaf) return;         // one scroll update per frame, not per key
    _centerRaf = requestAnimationFrame(() => {
        _centerRaf = 0;
        const currentEl = document.getElementById(`char-${currentCharIndex}`);
        if (!currentEl) return;
        if (!_cachedContainerHeight) {
            const container = document.getElementById('game-container');
            if (!container) return;
            _cachedContainerHeight = container.clientHeight;
        }
        const offset = (_cachedContainerHeight / 2) - currentEl.offsetTop - 25;
        textStream.style.transform = `translateY(${offset}px)`;
    });
}

function highlightCurrentChar() {
    // Was: querySelectorAll('.letter.active') — a full-document scan, every key.
    if (_activeLetterEl) _activeLetterEl.classList.remove('active');
    const el = document.getElementById(`char-${currentCharIndex}`);
    _activeLetterEl = el || null;
    if (el) { el.classList.add('active'); highlightKey(fullText[currentCharIndex]); }
    updateHandGuide();
    updateProgressBars();
}

// renderText() throws away every span, so the tracked element is now detached.
// Anything that rebuilds the stream must call this or the next highlight will
// try to clean up a node that is no longer in the document. Harmless, but it
// would quietly leak the old chapter's DOM.
function resetActiveLetterTracking() {
    _activeLetterEl = null;
    _cachedContainerHeight = 0;
}

function updateImageDisplay() {
    const p = document.getElementById('image-panel');
    if(p) p.style.display = 'none';
}

// Returns true if position A is ahead of position B in the book
function isPositionAhead(chapA, idxA, chapB, idxB) {
    const a = parseInt(chapA) || 0;
    const b = parseInt(chapB) || 0;
    return a > b || (a === b && idxA > idxB);
}

// ═════════════════════════════════════════════════════════════════════════════
// PERSISTENCE — write-ahead log + coalesced flush
// ═════════════════════════════════════════════════════════════════════════════
//
// The old saveProgress() fired on every '.', '!', '?' and newline, and each call
// wrote THREE documents. At 7,000 students that was ~236,000 writes/day against
// a 20,000/day free tier.
//
// What replaced it is not "save less" — it's "save to the right place first."
// Every sentence still records everything, synchronously, to localStorage. That
// is the durable copy and it costs nothing. Firestore gets a batched flush every
// FLUSH_INTERVAL_MS and on every event that actually ends a session.
//
// This is STRICTLY MORE durable than what it replaced. The old code lost
// everything typed since the last punctuation mark if the tab died. The WAL
// loses nothing — on next load we detect unflushed local state and replay it.
// Firestore is now the sync-and-reporting layer; localStorage is the safety net.

const WAL_KEY = 'ttb_wal_v2';
const FLUSH_INTERVAL_MS = 300000;   // 5 minutes
let walFlushTimer = null;
let walDirty = false;
let pendingSessions = [];           // sprint records awaiting a rollup write
let statsDocDirty = false;          // stats/time_tracking is only read at load,
                                    // so it only needs writing at session end
// Denormalised tenancy stamps, written onto every log so reports can be scoped
// by class or building without reading the whole collection. See MULTITENANCY.md.
let ttbClassId = '';
let ttbSchoolId = '';

function walSnapshot() {
    return {
        v: 2,
        uid: currentUser ? currentUser.uid : '',
        bookId: currentBookId,
        savedAt: Date.now(),
        progress: isPracticeMode ? null : {
            chapter: currentChapterNum,
            charIndex: currentCharIndex,
            furthestChapter: furthestChapter,
            furthestCharIndex: furthestCharIndex,
            completedChapters: Array.from(completedChapters)
        },
        stats: { ...statsData },
        sessions: pendingSessions
    };
}

function walSave() {
    if (!currentUser || currentUser.isAnonymous) return;
    try { localStorage.setItem(WAL_KEY, JSON.stringify(walSnapshot())); }
    catch (e) { console.warn("WAL write failed (quota?):", e); }
}

function walLoad() {
    try {
        const raw = localStorage.getItem(WAL_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

function walClear() {
    try { localStorage.removeItem(WAL_KEY); } catch (_) {}
}

// Called wherever saveProgress() used to be. Records to localStorage now and
// schedules a Firestore flush. Cheap enough to call on every keystroke if needed.
function markDirty() {
    if (!currentUser || currentUser.isAnonymous) return;
    if (!isPracticeMode && isPositionAhead(currentChapterNum, currentCharIndex, furthestChapter, furthestCharIndex)) {
        furthestChapter = currentChapterNum;
        furthestCharIndex = currentCharIndex;
    }
    walDirty = true;
    walSave();
    if (!walFlushTimer) {
        walFlushTimer = setTimeout(() => { walFlushTimer = null; flushAll('interval'); }, FLUSH_INTERVAL_MS);
    }
}

// ⚠️ RE-ENTRANCY GUARD — THIS ONE CORRUPTED TEACHER-FACING DATA.
//
// flushAll() is reachable from four places: the interval timer, the
// visibilitychange handler, saveProgress(force), and walRecover(). It is async
// with four sequential awaits, so two runs could overlap. When they did, both
// captured the SAME `sessionsBeingWritten = pendingSessions.slice()`, both
// addDoc()'d that rollup, and both then ran `pendingSessions.slice(n)`.
//
// Result: a duplicate typing_sessions document. The main report table reads
// typing_logs, which is a merge and therefore immune — but the per-day sprint
// drill-down a teacher opens to check a student's work reads typing_sessions,
// and it was double-counting minutes and sprint totals.
//
// Serialising is enough. A caller arriving mid-flush waits for the running
// flush to finish and then runs its own, so a late-arriving `final` still gets
// its rollup written rather than being silently dropped.
//
// ⚠️ THE LOOP IS `while`, NOT `if`, AND THAT IS THE WHOLE GUARD. (v3.9.2)
//
// v3.9.1 wrote `if (_flushInFlight) await _flushInFlight`, which holds for two
// callers and fails for three. With A running and B and C both parked on A's
// promise: A resolves, A's finally nulls the slot, and B and C are BOTH already
// past the `if` — so both assign `_flushInFlight` and both inner runs execute
// concurrently, which is the exact duplicate-rollup bug the guard exists to
// prevent. Measured, not reasoned: 6 simultaneous callers gave 5 overlapping
// inner runs.
//
// `while` closes it because re-checking after the await is synchronous with the
// assignment that follows — B leaves the loop and claims the slot in one
// uninterrupted step, so C's re-check sees B's promise and parks on that
// instead. There are four call sites (interval timer, visibilitychange,
// saveProgress(force), walRecover()), so three-deep is reachable in normal use.
let _flushInFlight = null;

async function flushAll(reason, final = false) {
    while (_flushInFlight) {
        await _flushInFlight.catch(() => {});
    }
    _flushInFlight = _flushAllInner(reason, final);
    try { await _flushInFlight; }
    finally { _flushInFlight = null; }
}

// Push local state to Firestore. `final` writes the rollup documents that only
// matter between sessions (stats doc, session history); the periodic flush skips
// them and writes position only.
async function _flushAllInner(reason, final = false) {
    if (!currentUser || currentUser.isAnonymous) return;
    if (!walDirty && !final && pendingSessions.length === 0) return;

    if (walFlushTimer) { clearTimeout(walFlushTimer); walFlushTimer = null; }

    const sessionsBeingWritten = pendingSessions.slice();
    let ok = true;

    // 1. Position + completed chapters — ONE document. These used to be two
    //    separate writes to the same doc, which billed twice for no reason.
    if (!isPracticeMode && walDirty) {
        try {
            // bodyIndex/bodyTotal are written HERE because this is the only place
            // that has the chapter list loaded. index.html strips the list before
            // caching the grid (largest field on the document), so without these
            // two numbers a cached library card cannot place a part-numbered book
            // and falls back to rounding the label. Two integers, same write, no
            // extra billing. Undefined is never written — a reader in front matter
            // has no body position and must not be given a made-up one.
            const _ord = bodyOrdinalMap().get(chapterKey(currentChapterNum));
            const _bodyTotal = bodyChapterList().length;
            await setDoc(doc(db, "users", currentUser.uid, "progress", currentBookId), {
                chapter: currentChapterNum,
                charIndex: currentCharIndex,
                furthestChapter: furthestChapter,
                furthestCharIndex: furthestCharIndex,
                completedChapters: Array.from(completedChapters),
                ...(_ord !== undefined ? { bodyIndex: _ord } : {}),
                ...(_bodyTotal ? { bodyTotal: _bodyTotal } : {}),
                lastUpdated: new Date()
            }, { merge: true });
            lastSavedIndex = currentCharIndex;
        } catch (e) { ok = false; console.warn(`Progress flush failed (${reason}):`, e); }
    }

    // 2. Daily log for reports. Always written on a flush — this is what
    //    reports.html reads, and a teacher looking mid-period should see today.
    if (walDirty || final) {
        try {
            const today = getLocalDateStr();
            await setDoc(doc(db, "typing_logs", `${currentUser.uid}_${today}`), {
                uid: currentUser.uid,
                email: currentUser.email || "",
                displayName: currentUser.displayName || "Anonymous",
                classId: ttbClassId || "",
                schoolId: ttbSchoolId || "",
                date: today,
                seconds: statsData.secondsToday || 0,
                chars: statsData.charsToday || 0,
                mistakes: statsData.mistakesToday || 0,
                lastUpdated: new Date()
            }, { merge: true });
        } catch (e) { ok = false; console.warn(`Log flush failed (${reason}):`, e); }
    }

    // 3. Week/day rollup. Only ever READ at page load, so it only needs to be
    //    correct by the time the student comes back. Session-end only.
    if (final && statsDocDirty) {
        try {
            await setDoc(doc(db, "users", currentUser.uid, "stats", "time_tracking"),
                         statsData, { merge: true });
            statsDocDirty = false;
        } catch (e) { ok = false; console.warn(`Stats flush failed (${reason}):`, e); }
    }

    // 4. Sprint history as ONE rollup doc instead of one doc per sprint. Twenty
    //    documents per block became one, which is what keeps storage under 1 GiB.
    if (final && sessionsBeingWritten.length > 0) {
        // ⚠️ CHUNKED, BECAUSE firestore.rules v2.2.0 CAN NOW REJECT THIS. (v3.9.2)
        //
        // The new typing_sessions create rule requires `sprints.size() <= 200`
        // and `seconds <= 86400`. Nothing on the client enforced either, and
        // pendingSessions has no cap: walRecover() CONCATENATES a recovered log
        // onto the live one (`wal.sessions.concat(pendingSessions)`), so a
        // student whose rollup write fails once carries those sprints forward.
        //
        // Unchunked that is a poison pill. Once the array crosses 200, every
        // future write is denied, denial sets ok = false, ok = false keeps the
        // WAL, and the kept WAL is re-concatenated next session — so it fails
        // permanently, silently, and grows while doing it. The tightening is
        // right; it just needs a client that can satisfy it.
        //
        // 200 sprints per document also keeps `seconds` far under 86400 by
        // construction (200 × a 30-second sprint is 100 minutes), so one cap
        // handles both. Chunks are advanced out of pendingSessions ONE AT A TIME
        // and only after their write lands, so a mid-run failure keeps exactly
        // the sprints that have not been stored yet — no loss, no duplication.
        const SPRINTS_PER_ROLLUP = 200;
        let written = 0;
        try {
            for (let i = 0; i < sessionsBeingWritten.length; i += SPRINTS_PER_ROLLUP) {
                const chunk = sessionsBeingWritten.slice(i, i + SPRINTS_PER_ROLLUP);
                const totals = chunk.reduce((a, s) => ({
                    seconds: a.seconds + s.seconds, chars: a.chars + s.chars,
                    mistakes: a.mistakes + s.mistakes
                }), { seconds: 0, chars: 0, mistakes: 0 });
                await addDoc(collection(db, "typing_sessions"), {
                    uid: currentUser.uid,
                    email: currentUser.email || "",
                    displayName: currentUser.displayName || "Anonymous",
                    classId: ttbClassId || "",
                    schoolId: ttbSchoolId || "",
                    date: getLocalDateStr(),
                    timestamp: new Date(),
                    bookId: currentBookId,
                    sprintCount: chunk.length,
                    // Clamped only as a backstop against a corrupted local
                    // total. If this ever actually clamps, the write survives
                    // and the console says so, which beats a silent denial.
                    seconds: Math.min(totals.seconds, 86400),
                    chars: totals.chars,
                    mistakes: totals.mistakes,
                    wpm: totals.seconds > 0 ? Math.round((totals.chars / 5) / (totals.seconds / 60)) : 0,
                    accuracy: (totals.chars + totals.mistakes) > 0
                        ? Math.round((totals.chars / (totals.chars + totals.mistakes)) * 100) : 100,
                    sprints: chunk,
                    // TTL field — set a Firestore TTL policy on this to keep the
                    // collection from growing without bound. See SCALE-PLAN.md.
                    expiresAt: new Date(Date.now() + 120 * 24 * 3600 * 1000)
                });
                if (totals.seconds > 86400) {
                    console.warn('Sprint rollup seconds clamped to 86400 — local ' +
                                 'total was ' + totals.seconds + ', which should be ' +
                                 'impossible in one day. Check the WAL.');
                }
                // Advance per chunk, not once at the end: whatever landed is gone
                // from the queue even if a later chunk fails.
                written += chunk.length;
                pendingSessions = pendingSessions.slice(chunk.length);
            }
        } catch (e) {
            ok = false;
            console.warn(`Session rollup failed (${reason}) after ${written} of ` +
                         `${sessionsBeingWritten.length} sprints:`, e);
        }
    }

    if (ok) {
        walDirty = false;
        // Only drop the WAL once everything durable has landed. If a periodic
        // flush succeeded but sessions are still pending, keep the log.
        if (final && pendingSessions.length === 0) walClear();
        else walSave();
    } else {
        walSave();   // keep the local copy; next flush retries
    }
}

// Recover anything the last session couldn't flush — a crashed tab, a dead
// battery, a closed lid on a network blip. Called after progress/stats load so
// it can compare against what Firestore actually has.
function walRecover() {
    const wal = walLoad();
    if (!wal || wal.v !== 2) { walClear(); return false; }
    if (!currentUser || wal.uid !== currentUser.uid) return false;
    if (wal.bookId !== currentBookId) return false;   // different book; leave it

    let recovered = false;

    // Position: take the WAL's only if it's genuinely further along.
    if (wal.progress && isPositionAhead(wal.progress.chapter, wal.progress.charIndex,
                                       currentChapterNum, currentCharIndex)) {
        currentChapterNum = wal.progress.chapter;
        currentCharIndex = wal.progress.charIndex;
        savedCharIndex = wal.progress.charIndex;
        recovered = true;
    }
    if (wal.progress && isPositionAhead(wal.progress.furthestChapter, wal.progress.furthestCharIndex,
                                        furthestChapter, furthestCharIndex)) {
        furthestChapter = wal.progress.furthestChapter;
        furthestCharIndex = wal.progress.furthestCharIndex;
        recovered = true;
    }
    if (wal.progress && Array.isArray(wal.progress.completedChapters)) {
        const before = completedChapters.size;
        wal.progress.completedChapters.forEach(c => completedChapters.add(String(c)));
        if (completedChapters.size > before) recovered = true;
    }

    // Time: only trust the WAL if it's for the same day/week AND is larger.
    // Counters only go up within a period, so max() is the safe merge.
    if (wal.stats && wal.stats.lastDate === statsData.lastDate) {
        for (const k of ['secondsToday', 'charsToday', 'mistakesToday']) {
            if ((wal.stats[k] || 0) > (statsData[k] || 0)) { statsData[k] = wal.stats[k]; recovered = true; }
        }
    }
    if (wal.stats && wal.stats.weekStart === statsData.weekStart) {
        for (const k of ['secondsWeek', 'charsWeek', 'mistakesWeek']) {
            if ((wal.stats[k] || 0) > (statsData[k] || 0)) { statsData[k] = wal.stats[k]; recovered = true; }
        }
    }

    if (Array.isArray(wal.sessions) && wal.sessions.length) {
        pendingSessions = wal.sessions.concat(pendingSessions);
        recovered = true;
    }

    if (recovered) {
        console.log("Recovered unflushed work from local storage.");
        statsDocDirty = true;
        walDirty = true;
        flushAll('recovery', true);
    } else {
        walClear();
    }
    return recovered;
}

// Kept as a thin alias so the ~8 existing call sites keep reading naturally.
// `force` used to mean "write even if the cursor hasn't moved"; now every call
// records locally regardless, and force means "get it to Firestore now."
async function saveProgress(force = false) {
    markDirty();
    if (force) await flushAll('forced', true);
}

async function saveCompletedChapters() {
    // Folded into the progress document — completedChapters rides along in
    // flushAll(). This used to be a second billable write to the same doc.
    markDirty();
}

function logSession(seconds, chars, mistakes, wpm, accuracy) {
    if (!currentUser || currentUser.isAnonymous) return;
    if (seconds < 5) return; // skip trivially short sessions
    pendingSessions.push({
        seconds, chars, mistakes, wpm, accuracy,
        chapter: currentChapterNum,
        at: new Date().toISOString()
    });
    statsDocDirty = true;
    markDirty();
}

// ⚠️ "The session really is over" WAS NOT TRUE. visibilitychange:hidden fires on
// every tab switch, every lid close, every app background — not just at the end
// of a period. A student bouncing to Google Classroom and back eight times fired
// eight full `final` flushes, each worth up to four Firestore writes plus a
// leaderboard write, and (before the guard above) each one racing the others.
//
// The localStorage WAL write is what actually protects the student's work, and
// it is free, so it still happens on EVERY hide. The Firestore flush is
// rate-limited to once a minute. Nothing in it is time-critical: the WAL is the
// durable copy, walRecover() replays it, and typing_logs is a merge so a teacher
// refreshing a report mid-period never sees a torn value.
const HIDDEN_FLUSH_MIN_GAP_MS = 60000;
let lastHiddenFlush = 0;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        walSave();                        // free, synchronous, always
        if (Date.now() - lastHiddenFlush >= HIDDEN_FLUSH_MIN_GAP_MS) {
            lastHiddenFlush = Date.now();
            flushLeaderboard();
            flushAll('hidden', true);
        }
    }
});

function formatTime(seconds) {
    if (!seconds) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

// Sanity-clamp a computed sprint WPM before it can reach sprintHistory or the
// leaderboard. Position warps with stale sprint state have produced absurd
// values (268,848 WPM was live on the board); no human types over ~300.
// Negative charsTyped (rollback/warp artifacts) also lands here.
function sanitizeSprintWPM(wpm, charsTyped) {
    if (!isFinite(wpm) || charsTyped < 0 || wpm < 0) return 0;
    if (wpm > 300) {
        console.warn(`Implausible sprint WPM ${wpm} (chars=${charsTyped}) — recording 0.`);
        return 0;
    }
    return wpm;
}

function calculateAverageWPM(chars, seconds) {
    if(!seconds || seconds <= 0) return 0;
    const mins = seconds / 60;
    return Math.round((chars / 5) / mins);
}

function calculateAverageAcc(chars, mistakes) {
    if(!chars || chars <= 0) return 100;
    const total = chars + mistakes;
    if(total === 0) return 100;
    return Math.round((chars / total) * 100);
}

async function pauseGameForBreak() {
    isGameActive = false; clearInterval(timerInterval); saveProgress();
    const charsTyped = currentCharIndex - sprintCharStart;
    const sprintMinutes = sprintSeconds / 60;
    const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
    const sprintTotalEntries = charsTyped + sprintMistakes;
    const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;

    // Log this session
    logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);

    // Accumulate typing time for practice unlock
    practiceTypingAccumulator += sprintSeconds;

    // Track anonymous usage
    anonSprintCount++;
    anonTotalSeconds += sprintSeconds;

    // Record sprint in history
    sprintHistory.push({ wpm: sprintWPM, acc: sprintAcc, time: sprintSeconds });

    // Update leaderboard and get placements
    const placements = await updateLeaderboard();

    // Check if anon user should be prompted to log in
    if (checkAnonLoginPrompt()) {
        showAnonLoginPrompt();
        return;
    }

    const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
    const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
    const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
    const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

    const stats = {
        time: sprintSeconds, wpm: sprintWPM, acc: sprintAcc,
        today: `${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)`,
        week: `${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)`,
        placements: placements || []
    };

    let title = "Sprint Complete";
    if (dailyGoalCelebrated && goals.dailySeconds > 0 && statsData.secondsToday - sprintSeconds < goals.dailySeconds) {
        title = "🎉 Daily Goal Reached!";
    }
    if (weeklyGoalCelebrated && goals.weeklySeconds > 0 && statsData.secondsWeek - sprintSeconds < goals.weeklySeconds) {
        title = "🎆 Weekly Goal Reached!";
    }

    showStatsModal(title, stats, "Continue", startGame);
}

function getMissedCharsHTML() {
    const entries = Object.entries(missedCharsMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    if (entries.length === 0) return '';
    const pills = entries.map(([ch, count]) => 
        `<span style="display:inline-block; background:#fff0f0; border:1px solid #ffcccc; border-radius:3px; padding:1px 6px; margin:0 2px; font-weight:bold; color:#D32F2F;">${ch} <small style="color:#999;">×${count}</small></span>`
    ).join('');
    const canPractice = currentUser && !currentUser.isAnonymous && !isPracticeMode;
    const practiceThreshold = hasDonePractice ? PRACTICE_COOLDOWN : PRACTICE_FIRST_UNLOCK;
    const practiceReady = practiceTypingAccumulator >= practiceThreshold;
    const outOfPractice = (practiceRemainingToday !== null && practiceRemainingToday <= 0);
    let practiceBtn = '';
    if (canPractice && outOfPractice) {
        // Known-exhausted. Saying so here beats letting them click, wait, and
        // read an error — and "comes back tomorrow" is the bit that matters.
        practiceBtn = ` <span style="font-size:0.85em; color:#aaa;">\u2728 Practice comes back tomorrow</span>`;
    } else if (canPractice && practiceReady) {
        practiceBtn = ` <button id="practice-btn" class="practice-btn" title="AI-generated practice focusing on your weak spots">\u2728 Practice</button>`;
    } else if (canPractice && !practiceReady) {
        // The counter only advances while keys are being pressed, so "keep
        // typing" is literally the instruction — the old wording implied waiting
        // would do it. Seconds below a minute, because ceil() turned 5 seconds
        // into "~1m" and made the app look like it was stalling.
        const left = Math.max(1, Math.round(practiceThreshold - practiceTypingAccumulator));
        const pretty = left >= 60 ? `~${Math.ceil(left / 60)} more min` : `${left} more sec`;
        practiceBtn = ` <span style="font-size:0.85em; color:#aaa;" title="The timer only counts while you're typing">\u2728 Practice unlocks after ${pretty} of typing</span>`;
    }
    return `<div style="font-size:0.8em; color:#888; margin:4px 0;">Watch out for: ${pills}${practiceBtn}</div>`;
}

function getPracticeSummaryHTML() {
    if (!practiceText || practiceProblemChars.length === 0) return '';

    // Compute practice-only misses by diffing with snapshot
    const practiceMisses = {};
    Object.entries(missedCharsMap).forEach(([ch, count]) => {
        const prev = practiceMissedSnapshot[ch] || 0;
        if (count > prev) practiceMisses[ch] = count - prev;
    });

    // Count occurrences of each focus char in practice text (case-insensitive)
    const results = practiceProblemChars.map(ch => {
        const lower = ch.toLowerCase();
        const upper = ch.toUpperCase();
        const displayCh = ch === 'Space' ? ' ' : ch === 'Enter' ? '\n' : ch;
        let total = 0;
        for (let i = 0; i < practiceText.length; i++) {
            const c = practiceText[i];
            if (c === displayCh || c === lower || c === upper) total++;
        }
        const missed = practiceMisses[ch] || 0;
        const hit = Math.max(0, total - missed);
        const acc = total > 0 ? Math.round((hit / total) * 100) : 100;
        return { ch, total, hit, missed, acc };
    }).filter(r => r.total > 0).slice(0, 5);

    if (results.length === 0) return '';

    // Grade each character
    const gradeChar = (acc) => {
        if (acc === 100) return { emoji: '⭐', color: '#FFD700', label: 'Perfect!' };
        if (acc >= 90) return { emoji: '🔥', color: '#FF6600', label: 'Great' };
        if (acc >= 75) return { emoji: '👍', color: '#43A047', label: 'Good' };
        if (acc >= 50) return { emoji: '💪', color: '#1E88E5', label: 'Keep at it' };
        return { emoji: '🎯', color: '#E53935', label: 'Needs work' };
    };

    // Overall practice grade
    const totalAll = results.reduce((s, r) => s + r.total, 0);
    const hitAll = results.reduce((s, r) => s + r.hit, 0);
    const overallAcc = totalAll > 0 ? Math.round((hitAll / totalAll) * 100) : 100;
    const overall = gradeChar(overallAcc);

    const rows = results.map(r => {
        const g = gradeChar(r.acc);
        const display = r.ch === 'Space' ? '␣' : r.ch;
        return `<div style="display:flex; align-items:center; gap:6px; padding:3px 0;">
            <span style="font-weight:bold; font-size:1.1em; width:24px; text-align:center; color:#333;">${escapeHtml(display)}</span>
            <div style="flex:1; height:14px; background:#eee; border-radius:7px; overflow:hidden;">
                <div style="height:100%; width:${r.acc}%; background:${g.color}; border-radius:7px; transition:width 0.3s;"></div>
            </div>
            <span style="font-size:0.85em; min-width:42px; text-align:right; color:${g.color}; font-weight:bold;">${r.acc}%</span>
            <span style="font-size:0.8em;">${g.emoji}</span>
        </div>`;
    }).join('');

    return `<div style="width:100%;">
        <div style="text-align:center; font-size:0.85em; margin-bottom:6px;">
            <div style="font-weight:bold;">Focus Characters</div>
            <div style="color:${overall.color}; font-weight:bold;">${overall.emoji} ${overallAcc}% ${overall.label}</div>
        </div>
        ${rows}
    </div>`;
}

function getPlacementsHTML(placements) {
    if (!placements || placements.length === 0) return '';
    const rows = placements.map(p => {
        let trophy, color;
        if (p.rank === 1) { trophy = '🥇'; color = '#FFD700'; }
        else if (p.rank === 2) { trophy = '🥈'; color = '#C0C0C0'; }
        else if (p.rank === 3) { trophy = '🥉'; color = '#CD7F32'; }
        else { trophy = '🏆'; color = '#4B9CD3'; }
        const catName = p.category.label.split(' ').slice(1).join(' ') || p.category.label;
        return `<div class="trophy-row"><span class="trophy-icon">${trophy}</span><span class="trophy-label" style="color:${color};">#${p.rank} ${catName}</span></div>`;
    }).join('');
    return `<div class="trophy-panel"><div class="trophy-header">🏆</div>${rows}</div>`;
}

function getSprintHistoryHTML() {
    if (sprintHistory.length <= 1) return '';
    const rows = sprintHistory.map((s, i) => {
        const label = i === sprintHistory.length - 1 ? '<b>→</b>' : `${i + 1}`;
        return `<span style="color:#999;">${label}</span> ${s.wpm}<small>wpm</small> ${s.acc}<small>%</small>`;
    }).join(' · ');
    return `<div style="font-size:0.75em; color:#777; margin:4px 0; line-height:1.6;">Sprints: ${rows}</div>`;
}

async function finishChapter() {
    isGameActive = false; clearInterval(timerInterval);
    chapterCompleteAt = Date.now();   // start the any-key grace period
    _ttbEmit('complete', { chapter: currentChapterNum });

    // Practice mode: log session and offer to return
    if (isPracticeMode) {
        const charsTyped = currentCharIndex - sprintCharStart;
        const sprintMinutes = sprintSeconds / 60;
        const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
        const sprintTotalEntries = charsTyped + sprintMistakes;
        const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;
        logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);
        await logPracticeSession(sprintWPM, sprintAcc, sprintSeconds, charsTyped, sprintMistakes);

        const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
        const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
        const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
        const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

        // Build practice-specific summary
        const summaryHTML = getPracticeSummaryHTML();

        isModalOpen = true; isInputBlocked = false;
        setModalTitle('');
        document.getElementById('modal-body').innerHTML = `
            <div style="display:flex; gap:0; align-items:stretch;">
                ${summaryHTML ? `<div style="flex:0 0 auto; min-width:180px; max-width:200px;"></div>` : ''}
                <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center;">
                    <div class="stats-title">✨ Practice Complete!</div>
                    <div class="stats-inline">
                        <span class="si-val">${sprintWPM} <small>WPM</small></span>
                        <span class="si-dot">·</span>
                        <span class="si-val">${sprintAcc}% <small>Acc</small></span>
                        <span class="si-dot">·</span>
                        <span class="si-val">${formatTime(sprintSeconds)}</span>
                    </div>
                    <div class="cumulative-row">
                        <span>Today: ${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)</span>
                        <span>Week: ${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)</span>
                    </div>
                    <div class="start-hint" style="margin-top:6px;">Press Enter to return</div>
                </div>
                ${summaryHTML ? `<div style="flex:0 0 auto; min-width:180px; max-width:200px; border-left:1px solid #eee; padding-left:12px; display:flex; align-items:center;">${summaryHTML}</div>` : ''}
            </div>
        `;
        resetModalFooter();
        const btn = document.getElementById('action-btn');
        btn.innerText = '📖 Return to Book'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
        btn.onclick = () => { closeModal(); exitPracticeMode(); };
        modalActionCallback = () => { closeModal(); exitPracticeMode(); };
        showModalPanel();
        return;
    }

    let nextChapterId = null;
    let nextChapterTitle = "";
    // ⚠️ WALKS THE BODY LIST, NOT THE SPINE (v3.12.0). v3.11.0 filtered the chapter
    // PICKER and left auto-advance walking the full list, which is worse than not
    // filtering at all: a student finishing the last chapter of a Standard Ebook was
    // offered the colophon as "next", then the uncopyright page. The picker said
    // those were not chapters and the Continue button then handed one over.
    {
        const list = bodyChapterList();
        const currentIdx = list.findIndex(c => chapterKey(c.id) === chapterKey(currentChapterNum));
        if (currentIdx !== -1 && currentIdx + 1 < list.length) {
            const nextChap = list[currentIdx + 1];
            nextChapterId = nextChap.id.replace("chapter_", "");
            nextChapterTitle = nextChap.title || "";
        }
    }

    // ⚠️ NO INVENTED NEXT CHAPTER (v3.12.0). This used to do
    // parseFloat(currentChapterNum) + 1, so finishing Augie's chapter 19 offered
    // "Ch. 20" — which does not exist — and finishing Heidi's "1.14" offered
    // "2.14", also nonexistent, while "1.01" would have offered "2.01": a real
    // chapter in the WRONG PART. nextChapterId now stays null, and null has a
    // meaning: there is no next body chapter, so the book is FINISHED. Handled
    // below, once the stats for this chapter exist to show alongside it.

    const charsTyped = currentCharIndex - sprintCharStart;
    const sprintMinutes = sprintSeconds / 60;
    const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
    const sprintTotalEntries = charsTyped + sprintMistakes;
    const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;

    // Log this session
    logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);

    // Accumulate typing time for practice unlock
    practiceTypingAccumulator += sprintSeconds;

    const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
    const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
    const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
    const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

    let title = `📖 Chapter ${currentChapterNum} Complete!`;

    // Mark chapter as completed
    completedChapters.add(String(currentChapterNum));
    saveCompletedChapters();
    const placements = await updateLeaderboard();

    const stats = {
        time: sprintSeconds, wpm: sprintWPM, acc: sprintAcc,
        today: `${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)`,
        week: `${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)`,
        placements: placements || []
    };
    if (dailyGoalCelebrated && goals.dailySeconds > 0 && statsData.secondsToday - sprintSeconds < goals.dailySeconds) {
        title = `🎉 Chapter ${currentChapterNum} Complete + Daily Goal!`;
    }
    if (weeklyGoalCelebrated && goals.weeklySeconds > 0 && statsData.secondsWeek - sprintSeconds < goals.weeklySeconds) {
        title = `🎆 Chapter ${currentChapterNum} Complete + Weekly Goal!`;
    }

    // ─── THE BOOK IS FINISHED (v3.12.0) ──────────────────────────────────────
    //
    // No next BODY chapter. This is the completion moment bodyChapters was written
    // for back in admin.js v3.18.x and which never had a consumer — because the old
    // code invented a chapter number instead of noticing, so a student who finished
    // a book was offered a chapter that did not exist and got an error rather than a
    // congratulation.
    //
    // Judged on the BODY list, so an appendix, endnotes, a colophon or an
    // uncopyright page no longer stand between a kid and the end of the story.
    if (!nextChapterId) {
        // The book is over. Say so loudly, name it, and put the credits one click
        // away — which is also the honest place for them: a reader who has just
        // typed every word of a book is exactly who should see who made it.
        //
        // index.html opens the About panel when it sees #about=<bookId>, so this is
        // a link rather than a duplicate renderer.
        const bookName = (bookMetadata && bookMetadata.title) ? bookMetadata.title : 'this book';
        // Styled inline rather than in style.css on purpose: this is the only place
        // it is used, and a rule in a shared stylesheet is a rule someone has to
        // find later. If it ever gets reused, move it.
        const extra =
            '<div style="margin:14px 0 4px; padding:14px 16px; border-radius:8px; ' +
                 'background:linear-gradient(135deg, rgba(196,158,86,0.16), rgba(196,158,86,0.05)); ' +
                 'border:1px solid rgba(196,158,86,0.45); text-align:center;">' +
              '<div style="font-size:1.05rem; font-weight:700; letter-spacing:0.01em;">' +
                 '\u2728 You finished ' + escapeHtmlG(bookName) + ' \u2728</div>' +
              '<div style="font-size:0.8rem; opacity:0.75; margin-top:3px;">' +
                 'Every chapter, every word.</div>' +
              '<a href="index.html#about=' + encodeURIComponent(currentBookId) + '" ' +
                 'style="display:inline-block; margin-top:9px; font-size:0.78rem; ' +
                 'color:var(--carolina-blue); text-decoration:underline;">' +
                 '\u2139 Who made this book</a>' +
            '</div>';
        showStatsModal(
            title, stats, 'Back to the library',
            async () => { window.location.href = 'index.html'; },
            '', true, extra);
        _ttbEmit('bookComplete', { bookId: currentBookId, chapters: bodyChapterList().length });
        return;
    }

    // Format the next chapter label for the button
    let nextLabel = `Ch. ${nextChapterId}`;
    if (nextChapterTitle && nextChapterTitle != nextChapterId) {
        if (nextChapterTitle.toLowerCase().startsWith('chapter')) nextLabel = nextChapterTitle;
        else nextLabel = `Ch. ${nextChapterId}: ${nextChapterTitle}`;
    }

    showStatsModal(title, stats, `Next → ${nextLabel}`, async () => {
        advanceToNextChapter();
    }, 'Press Enter to continue', true);
}

async function advanceToNextChapter() {
    let nextChapterId = null;
    {
        const list = bodyChapterList();
        const currentIdx = list.findIndex(c => chapterKey(c.id) === chapterKey(currentChapterNum));
        if (currentIdx !== -1 && currentIdx + 1 < list.length) {
            nextChapterId = list[currentIdx + 1].id.replace("chapter_", "");
        }
    }
    if (!nextChapterId) {
        // ⚠️ NO parseFloat ARITHMETIC (v3.12.0). This fallback used to do
        // parseFloat(currentChapterNum) + 1, so on Heidi chapter "1.14" it asked for
        // "2.14" — a chapter that does not exist — and on "1.01" it asked for "2.01",
        // which does, and is in the WRONG PART. Fifth appearance of arithmetic-on-an-id
        // in this project. If the chapter is not in the body list there is no next
        // chapter, and saying so is better than guessing at one.
        //
        // First chapter of the body list is the only sane recovery: it is a real
        // id that definitely exists, whereas "1" was an assumption about numbering
        // that a part-numbered book breaks.
        const list = bodyChapterList();
        if (!list.length) return;
        nextChapterId = String(list[0].id).replace("chapter_", "");
    }
    // Advance state first, then flush ONCE. This used to flush the old position
    // and then immediately write the new chapter — two billable writes for one
    // navigation. completedChapters and furthest-position both ride along.
    currentChapterNum = nextChapterId;
    savedCharIndex = 0; currentCharIndex = 0; lastSavedIndex = 0;
    await saveProgress(true);
    autoStartNext = true;
    loadChapter(nextChapterId);
}

function getHeaderHTML() {
    if (isPracticeMode) {
        updateBookInfoBar('✨ Practice Mode', 'AI-Generated Exercise');
        return `<div class="modal-header-compact"><span class="mh-book">✨ Practice Mode</span> <span class="mh-sep">—</span> <span class="mh-chap">Targeted Exercise</span></div>`;
    }
    let bookTitle = (bookMetadata && bookMetadata.title) ? escapeHtml(bookMetadata.title) : escapeHtml(currentBookId.replace(/_/g, ' '));

    let displayChapTitle = `Ch. ${escapeHtml(String(currentChapterNum))}`;

    if (bookMetadata && bookMetadata.chapters) {
        const c = bookMetadata.chapters.find(ch => ch.id == "chapter_" + currentChapterNum);
        if (c && c.title) {
            if(c.title != currentChapterNum) {
                if(c.title.toLowerCase().startsWith('chapter')) {
                    displayChapTitle = escapeHtml(c.title);
                } else {
                    displayChapTitle = `Ch. ${escapeHtml(String(currentChapterNum))}: ${escapeHtml(c.title)}`;
                }
            }
        }
    }

    updateBookInfoBar(bookTitle, displayChapTitle);
    return `<div class="modal-header-compact"><span class="mh-book">${bookTitle}</span> <span class="mh-sep">—</span> <span class="mh-chap">${displayChapTitle}</span></div>`;
}

function updateBookInfoBar(bookTitle, chapTitle) {
    const bar = document.getElementById('book-info-bar');
    if (!bar) return;
    if (!bookTitle) { bar.innerHTML = ''; return; }
    bar.innerHTML = `<span class="bib-title">${bookTitle}</span><span class="bib-sep">—</span><span class="bib-chap">${chapTitle || ''}</span>`;
}

function showStartModal(btnText) {
    isModalOpen = true; isInputBlocked = false;
    modalActionCallback = startGame;
    setModalTitle('');
    resetModalFooter();

    const todayWPM = calculateAverageWPM(statsData.charsToday, statsData.secondsToday);
    const todayAcc = calculateAverageAcc(statsData.charsToday, statsData.mistakesToday);
    const weekWPM = calculateAverageWPM(statsData.charsWeek, statsData.secondsWeek);
    const weekAcc = calculateAverageAcc(statsData.charsWeek, statsData.mistakesWeek);

    const hasStats = statsData.secondsToday > 0 || statsData.secondsWeek > 0;
    const statsSection = hasStats ? `
        <div class="cumulative-row">
            <span>Today: ${formatTime(statsData.secondsToday)} (${todayWPM} WPM | ${todayAcc}%)</span>
            <span>Week: ${formatTime(statsData.secondsWeek)} (${weekWPM} WPM | ${weekAcc}%)</span>
        </div>
        ${getGoalProgressHTML()}
    ` : (goals.dailySeconds > 0 || goals.weeklySeconds > 0) ? getGoalProgressHTML() : '';

    // Check if furthest point is ahead — offer jump link
    let jumpHtml = '';
    if (currentUser && !currentUser.isAnonymous && 
        isPositionAhead(furthestChapter, furthestCharIndex, currentChapterNum, currentCharIndex)) {
        let chapLabel = `Ch. ${furthestChapter}`;
        if (bookMetadata && bookMetadata.chapters) {
            const chap = bookMetadata.chapters.find(c => c.id === "chapter_" + furthestChapter);
            if (chap && chap.title && chap.title != furthestChapter) {
                if (chap.title.toLowerCase().startsWith('chapter')) chapLabel = chap.title;
                else chapLabel = `Ch. ${furthestChapter}: ${chap.title}`;
            }
        }
        jumpHtml = `<div style="margin:4px 0;"><a href="#" id="jump-furthest" style="color:var(--carolina-blue); font-size:0.85em;">📚 Jump to furthest point (${escapeHtml(chapLabel)})</a></div>`;
    }

    document.getElementById('modal-body').innerHTML = `
        ${statsSection}
        ${jumpHtml}
        <div class="start-controls">
            ${getDropdownHTML()}
            <div class="start-hint">Type first character to start · ESC to pause</div>
        </div>
    `;

    // Wire jump link
    const jumpLink = document.getElementById('jump-furthest');
    if (jumpLink) {
        jumpLink.onclick = async (e) => {
            e.preventDefault();
            currentChapterNum = furthestChapter;
            savedCharIndex = furthestCharIndex;
            lastSavedIndex = furthestCharIndex;
            closeModal();
            await loadChapter(furthestChapter);
        };
    }

    const btn = document.getElementById('action-btn');
    btn.innerText = btnText; btn.onclick = startGame; btn.disabled = false; btn.style.display = 'inline-block'; btn.style.opacity = '1';
    showModalPanel();
}

// extraHTML (v3.12.2) is an optional block rendered below the stats and above the
// hint. Added so the book-completion screen can offer "About this book" without
// abusing the hint slot, which starts display:none and is revealed conditionally.
// Optional and defaulted, so the five existing callers are untouched.
// game.js has no HTML escaper of its own and this string is a book title from
// Firestore, rendered into innerHTML.
function escapeHtmlG(str) {
    const d = document.createElement('div');
    d.textContent = String(str == null ? '' : str);
    return d.innerHTML;
}

function showStatsModal(title, stats, btnText, callback, hint, instant, extraHTML) {
    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = () => { closeModal(); if(callback) callback(); };
    setModalTitle('');

    const trophyHTML = getPlacementsHTML(stats.placements);
    const hasTrophies = trophyHTML.length > 0;

    document.getElementById('modal-body').innerHTML = `
        <div class="${hasTrophies ? 'stats-with-trophies' : ''}">
            ${hasTrophies ? '<div class="stats-balance"></div>' : ''}
            <div class="${hasTrophies ? 'stats-main' : ''}">
                <div class="stats-title">${title}</div>
                <div class="stats-inline">
                    <span class="si-val">${stats.wpm} <small>WPM</small></span>
                    <span class="si-dot">·</span>
                    <span class="si-val">${stats.acc}% <small>Acc</small></span>
                    <span class="si-dot">·</span>
                    <span class="si-val">${formatTime(stats.time)}</span>
                    ${bestStreak > 0 ? `<span class="si-dot">·</span><span class="si-val">🔥${bestStreak}</span>` : ''}
                </div>
                <div class="cumulative-row">
                    <span>Today: ${stats.today}</span>
                    <span>Week: ${stats.week}</span>
                </div>
                ${getGoalProgressHTML()}
                ${getSprintHistoryHTML()}
                ${getMissedCharsHTML()}
                ${extraHTML || ''}
                ${hint ? `<div class="start-hint" id="modal-hint" style="display:none;">${hint}</div>` : ''}
            </div>
            ${trophyHTML}
        </div>
    `;

    // Add sprint length dropdown to footer alongside button
    const returnLink = isPracticeMode ? `<a href="#" id="practice-return" style="color:var(--carolina-blue); font-size:0.75em;">↩ Return to Book</a>` : '';
    document.getElementById('modal-footer').innerHTML = `
        <div class="modal-footer-row">
            <select id="sprint-select" class="modal-select modal-select-sm">${getSessionOptionsHTML()}</select>
            <button id="action-btn" class="modal-btn">Action</button>
        </div>
        ${returnLink}
    `;

    // Wire practice button if present
    const practiceBtn = document.getElementById('practice-btn');
    if (practiceBtn) {
        practiceBtn.onclick = () => startPracticeMode();
    }
    // Wire return-to-book link
    const returnEl = document.getElementById('practice-return');
    if (returnEl) {
        returnEl.onclick = (e) => { e.preventDefault(); exitPracticeMode(); };
    }
    // Save sprint changes immediately so smart-start (which closes modal first) sees them
    document.getElementById('sprint-select').onchange = (e) => {
        sessionValueStr = e.target.value;
        sessionLimit = (sessionValueStr === 'infinity') ? 'infinity' : parseInt(sessionValueStr);
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
    };

    const btn = document.getElementById('action-btn');
    if (instant) {
        btn.innerText = btnText; btn.onclick = modalActionCallback; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
        isInputBlocked = false;
        const hintEl = document.getElementById('modal-hint');
        if (hintEl) hintEl.style.display = '';
    } else {
        btn.innerText = "Wait..."; btn.onclick = modalActionCallback; btn.disabled = true; btn.style.opacity = '0.5'; btn.style.display = 'inline-block';
        const gen = ++modalGeneration;
        setTimeout(() => {
            if (modalGeneration !== gen) return;
            isInputBlocked = false;
            if(document.getElementById('action-btn')) {
                const b = document.getElementById('action-btn');
                b.style.opacity = '1'; b.innerText = btnText; b.disabled = false;
            }
            const hintEl = document.getElementById('modal-hint');
            if (hintEl) hintEl.style.display = '';
        }, SPRINT_COOLDOWN_MS);
    }
    showModalPanel();
}


function checkAnonLoginPrompt() {
    if (anonPromptShown) return false;
    if (currentUser) return false; // already logged in
    if (anonSprintCount >= 2 || anonTotalSeconds >= 150) {
        anonPromptShown = true;
        return true;
    }
    return false;
}

function showAnonLoginPrompt() {
    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = null;
    setModalTitle('');
    resetModalFooter();

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">Nice work! 👏</div>
            <div style="font-size:0.95em; color:#555; margin: 8px 0;">
                You're making real progress! Sign in to save your work so you can pick up right where you left off next time.
            </div>
        </div>
    `;

    const btn = document.getElementById('action-btn');
    btn.innerText = 'Wait...'; btn.disabled = true; btn.style.opacity = '0.5'; btn.style.display = 'inline-block';
    const signInAction = async () => {
        try {
            anonLoginInProgress = true;
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
            anonLoginInProgress = false;
            // User cancelled login — just continue
            closeModal();
            showStartModal("Continue");
            return;
        }

        // Login succeeded — retroactively save anonymous session time
        if (currentUser && !currentUser.isAnonymous) {
            try {
                // Apply anonymous typing stats to their account
                const today = new Date();
                const dateStr = today.getFullYear() + '-' +
                    String(today.getMonth()+1).padStart(2,'0') + '-' +
                    String(today.getDate()).padStart(2,'0');
                const weekStart = getWeekStart(today);

                // Load existing stats first
                const statsRef = doc(db, "users", currentUser.uid, "stats", "time_tracking");
                const statsSnap = await getDoc(statsRef);
                if (statsSnap.exists()) {
                    const data = statsSnap.data();
                    if (data.lastDate === dateStr) {
                        statsData.secondsToday = (data.secondsToday || 0) + statsData.secondsToday;
                        statsData.charsToday = (data.charsToday || 0) + statsData.charsToday;
                        statsData.mistakesToday = (data.mistakesToday || 0) + statsData.mistakesToday;
                    }
                                if ((data.weekStart || '') === weekStart) {
                        statsData.secondsWeek = (data.secondsWeek || 0) + statsData.secondsWeek;
                        statsData.charsWeek = (data.charsWeek || 0) + statsData.charsWeek;
                        statsData.mistakesWeek = (data.mistakesWeek || 0) + statsData.mistakesWeek;
                    }
                }
                statsData.lastDate = dateStr;
                statsData.weekStart = weekStart;
                await setDoc(statsRef, statsData, { merge: true });

                // Load goals since auth handler was skipped
                await loadGoals();
                const initialsPromptShown = await loadInitials();
                trophyBtn.classList.remove('hidden');

                // Read their saved progress BEFORE writing anything to it
                const progRef = doc(db, "users", currentUser.uid, "progress", currentBookId);
                const progSnap = await getDoc(progRef);
                let savedChap = null, savedIdx = 0, savedFurthestChap = null, savedFurthestIdx = 0;
                if (progSnap.exists()) {
                    const data = progSnap.data();
                    savedChap = data.chapter || null;
                    savedIdx = data.charIndex || 0;
                    savedFurthestChap = data.furthestChapter || savedChap;
                    savedFurthestIdx = data.furthestCharIndex || savedIdx;
                    if (data.completedChapters && Array.isArray(data.completedChapters)) {
                        completedChapters = new Set(data.completedChapters.map(String));
                    }
                }

                // Update furthest: take the max of saved furthest and current anonymous position
                if (savedFurthestChap !== null) {
                    furthestChapter = savedFurthestChap;
                    furthestCharIndex = savedFurthestIdx;
                }
                if (isPositionAhead(currentChapterNum, currentCharIndex, furthestChapter, furthestCharIndex)) {
                    furthestChapter = currentChapterNum;
                    furthestCharIndex = currentCharIndex;
                }

                // Now save progress — write current position + updated furthest
                await setDoc(progRef, {
                    chapter: currentChapterNum,
                    charIndex: currentCharIndex,
                    furthestChapter: furthestChapter,
                    furthestCharIndex: furthestCharIndex,
                    lastUpdated: new Date()
                }, { merge: true });
            } catch(e) { console.warn("Retroactive save failed:", e); }

            // If initials prompt is showing, let it handle the flow
            if (!userInitials) {
                anonLoginInProgress = false;
                return;
            }

            // Check if furthest point is ahead of current position
            if (isPositionAhead(furthestChapter, furthestCharIndex, currentChapterNum, currentCharIndex)) {
                anonLoginInProgress = false;
                showJumpToProgressPrompt(furthestChapter, furthestCharIndex);
                return;
            }
        }

        anonLoginInProgress = false;
        closeModal();
        showStartModal("Continue");
    };
    btn.onclick = signInAction;

    // Add a skip link below (initially hidden)
    const footer = document.getElementById('modal-footer');
    const skip = document.createElement('div');
    skip.innerHTML = `<a href="#" id="anon-skip" style="color:#999; font-size:0.8rem; margin-top:6px; display:none;">No thanks, keep typing</a>`;
    footer.appendChild(skip);
    document.getElementById('anon-skip').onclick = (e) => {
        e.preventDefault();
        closeModal();
        showStartModal("Continue");
    };

    showModalPanel();

    // 3-second cooldown before allowing dismissal
    const gen = ++modalGeneration;
    setTimeout(() => {
        if (modalGeneration !== gen) return;
        isInputBlocked = false;
        const b = document.getElementById('action-btn');
        if (b) { b.innerText = 'Sign In'; b.disabled = false; b.style.opacity = '1'; }
        const skipEl = document.getElementById('anon-skip');
        if (skipEl) skipEl.style.display = 'inline-block';
        // Set modalActionCallback so smart-start typing skips to continue
        modalActionCallback = () => { closeModal(); showStartModal("Continue"); };
    }, SPRINT_COOLDOWN_MS * 2);
}

function showAnonInfiniteReminder() {
    isGameActive = false; clearInterval(timerInterval);

    // Log the sprint so far so typing time counts for stats
    const charsTyped = currentCharIndex - sprintCharStart;
    const sprintMinutes = sprintSeconds / 60;
    const sprintWPM = sanitizeSprintWPM(
        (sprintMinutes > 0) ? Math.round((charsTyped / 5) / sprintMinutes) : 0, charsTyped);
    const sprintTotalEntries = charsTyped + sprintMistakes;
    const sprintAcc = (sprintTotalEntries > 0) ? Math.round((charsTyped / sprintTotalEntries) * 100) : 100;
    if (sprintSeconds > 0) logSession(sprintSeconds, charsTyped, sprintMistakes, sprintWPM, sprintAcc);
    practiceTypingAccumulator += sprintSeconds;
    anonTotalSeconds += sprintSeconds;

    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = null;
    setModalTitle('');
    resetModalFooter();

    const minutes = Math.round((anonTotalSeconds) / 60);
    const isFirst = anonInfiniteReminders === 1;

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">${isFirst ? '⚠️ Your progress isn\'t being saved!' : '🚨 Still not signed in!'}</div>
            <div style="font-size:0.95em; color:#555; margin: 8px 0;">
                ${isFirst
                    ? `You've been typing for <b>${minutes} minutes</b> — great work! But none of this is being saved. If you close this tab, it's all gone.`
                    : `That's <b>${minutes} minutes</b> of typing that will be <b>lost</b> if you close this tab. Please sign in to keep your progress!`
                }
            </div>
            <div style="font-size:0.85em; color:#888; margin-top:6px;">Sign in with your school Google account to save your work.</div>
        </div>
    `;

    const btn = document.getElementById('action-btn');
    btn.innerText = 'Wait...'; btn.disabled = true; btn.style.opacity = '0.5'; btn.style.display = 'inline-block';

    const signInAction = async () => {
        try {
            anonLoginInProgress = true;
            await signInWithPopup(auth, new GoogleAuthProvider());
            // Reload to properly initialize with signed-in user
            anonLoginInProgress = false;
            location.reload();
        } catch (e) {
            anonLoginInProgress = false;
            closeModal();
            startGame();
            return;
        }
    };

    const gen = ++modalGeneration;
    setTimeout(() => {
        if (modalGeneration !== gen) return;
        isInputBlocked = false;
        const b = document.getElementById('action-btn');
        if (b) { b.innerText = '🔑 Sign In'; b.disabled = false; b.style.opacity = '1'; b.onclick = signInAction; }
        // Smart-start typing dismisses the prompt (sign-in is via button only)
        modalActionCallback = () => { closeModal(); startGame(); };
        // Add skip link
        const footer = document.getElementById('modal-footer');
        if (footer && !document.getElementById('anon-infinite-skip')) {
            const skip = document.createElement('a');
            skip.id = 'anon-infinite-skip';
            skip.href = '#';
            skip.style.cssText = 'display:block; color:#999; font-size:0.75em; margin-top:4px;';
            skip.innerText = isFirst ? 'Skip for now' : 'I understand the risk, continue';
            skip.onclick = (e) => { e.preventDefault(); closeModal(); startGame(); };
            footer.appendChild(skip);
        }
    }, SPRINT_COOLDOWN_MS);
    showModalPanel();
}

function showJumpToProgressPrompt(savedChap, savedIdx) {
    isModalOpen = true; isInputBlocked = false;
    setModalTitle('');
    resetModalFooter();

    // Find chapter title
    let chapLabel = `Chapter ${savedChap}`;
    if (bookMetadata && bookMetadata.chapters) {
        const chap = bookMetadata.chapters.find(c => c.id === "chapter_" + savedChap);
        if (chap && chap.title && chap.title != savedChap) {
            if (chap.title.toLowerCase().startsWith('chapter')) chapLabel = chap.title;
            else chapLabel = `Ch. ${savedChap}: ${chap.title}`;
        }
    }

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">Welcome back! 📚</div>
            <div style="font-size:0.95em; color:#555; margin: 8px 0;">
                You were previously on <b>${escapeHtml(chapLabel)}</b>. Would you like to pick up where you left off?
            </div>
        </div>
    `;

    const btn = document.getElementById('action-btn');
    btn.innerText = `Jump to ${escapeHtml(chapLabel)}`; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    btn.onclick = async () => {
        currentChapterNum = savedChap;
        savedCharIndex = savedIdx;
        lastSavedIndex = savedIdx;
        closeModal();
        await loadChapter(savedChap);
    };

    // Add stay option
    const footer = document.getElementById('modal-footer');
    const stay = document.createElement('div');
    stay.innerHTML = `<a href="#" id="stay-here" style="color:#999; font-size:0.8rem; margin-top:6px; display:inline-block;">Stay here and keep typing</a>`;
    footer.appendChild(stay);
    document.getElementById('stay-here').onclick = (e) => {
        e.preventDefault();
        closeModal();
        showStartModal("Continue");
    };

    modalActionCallback = () => { closeModal(); showStartModal("Continue"); };
    showModalPanel();
}

function getGoalProgressHTML() {
    if (goals.dailySeconds <= 0 && goals.weeklySeconds <= 0) return '';
    
    let html = '<div class="goal-progress-row">';
    
    if (goals.dailySeconds > 0) {
        const dailyPct = Math.min(100, Math.round((statsData.secondsToday / goals.dailySeconds) * 100));
        const met = statsData.secondsToday >= goals.dailySeconds;
        html += `<div class="goal-item">
            <span class="goal-label">🎉 Daily</span>
            <div class="goal-bar"><div class="goal-fill" style="width:${dailyPct}%; background:${met ? '#22c55e' : '#4B9CD3'};"></div></div>
            <span class="goal-pct" style="color:${met ? '#22c55e' : '#888'};">${dailyPct}%${met ? ' ✓' : ''}</span>
        </div>`;
    }
    
    if (goals.weeklySeconds > 0) {
        const weeklyPct = Math.min(100, Math.round((statsData.secondsWeek / goals.weeklySeconds) * 100));
        const met = statsData.secondsWeek >= goals.weeklySeconds;
        html += `<div class="goal-item">
            <span class="goal-label">🎆 Weekly</span>
            <div class="goal-bar"><div class="goal-fill" style="width:${weeklyPct}%; background:${met ? '#FFD700' : '#4B9CD3'};"></div></div>
            <span class="goal-pct" style="color:${met ? '#FFD700' : '#888'};">${weeklyPct}%${met ? ' ✓' : ''}</span>
        </div>`;
    }
    
    html += '</div>';
    return html;
}

function getSessionOptionsHTML() {
    const options = [{val: "30", label: "30 Seconds"}, {val: "60", label: "1 Minute"}, {val: "120", label: "2 Minutes"}, {val: "300", label: "5 Minutes"}, {val: "infinity", label: "Open Ended (∞)"}];
    return options.map(opt => `<option value="${opt.val}" ${sessionValueStr === opt.val ? 'selected' : ''}>${opt.label}</option>`).join('');
}

function getDropdownHTML() {
    return `<div style="text-align:center;"><label for="sprint-select" style="color:#777; font-size:0.8rem; display:block; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">Session Length</label><select id="sprint-select" class="modal-select">${getSessionOptionsHTML()}</select></div>`;
}

function closeModal() {
    isModalOpen = false; isInputBlocked = false; 
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('virtual-keyboard').classList.remove('hidden');
    resetModalFooter();
    const keyboard = document.getElementById('virtual-keyboard'); if(keyboard) keyboard.focus();
}

function resetModalFooter() {
    document.getElementById('modal-footer').innerHTML = `<button id="action-btn" class="modal-btn">Action</button>`;
}

function showModalPanel() {
    document.getElementById('virtual-keyboard').classList.add('hidden');
    document.getElementById('modal').classList.remove('hidden');
}

function setModalTitle(text) {
    const bar = document.getElementById('modal-title-bar');
    document.getElementById('modal-title').innerText = text;
    if (text) bar.classList.remove('no-title');
    else bar.classList.add('no-title');
}

async function openMenuModal() {
    // Quietly pause without showing break modal
    const wasActive = isGameActive;
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }
    isModalOpen = true; isInputBlocked = false;
    modalGeneration++;
    modalActionCallback = () => { closeModal(); createHandGuide(); startGame(); };
    resetModalFooter();

    setModalTitle('Settings');

    const chapBuild = buildChapterOptions(currentChapterNum, '');
    const chapterOptions = chapBuild.html;
    const showChapFilter = chapBuild.total > CHAPTER_FILTER_MIN;

    let bookOptions = "";
    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        querySnapshot.forEach((doc) => {
            const b = doc.data();
            const id = doc.id;
            const title = escapeHtml(b.title || id);
            const sel = (id === currentBookId) ? "selected" : "";
            bookOptions += `<option value="${escapeHtml(id)}" ${sel}>${title}</option>`;
        });
    } catch(e) { console.warn(e); }

    // Schools are cached 24h, so this is one read per day per student at most.
    const schools = (currentUser && !currentUser.isAnonymous) ? await loadSchools() : [];
    const teacherAssigned = !!ttbClassId;
    const mySchoolName = (schools.find(s => s.id === ttbSchoolId) || {}).name || '';
    const schoolHTML = (currentUser && !currentUser.isAnonymous && (schools.length || ttbSchoolId)) ? `
        <div class="menu-label" style="margin-top:8px;">School</div>
        ${teacherAssigned ? `
            <div style="font-size:0.75em; color:#666; margin-top:3px; text-align:center;">
                ${escapeHtml(mySchoolName || 'Assigned')}<br>
                <span style="color:#aaa; font-size:0.9em;">set by your teacher</span>
            </div>`
        : `
            <select id="school-select" class="modal-select" style="margin:3px 0 0 0;">
                <option value="" ${!ttbSchoolId ? 'selected' : ''}>— No school —</option>
                ${schools.map(s => `<option value="${escapeHtml(s.id)}" ${s.id === ttbSchoolId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
            <div id="school-status" style="font-size:0.7em; color:#888; min-height:1em; margin-top:2px;"></div>`}
    ` : '';

    const initialsHTML = (currentUser && !currentUser.isAnonymous) ? `
        <div class="menu-col menu-col-initials">
            <div class="menu-label">Initials</div>
            <input id="initials-input" type="text" maxlength="3" value="${escapeHtml(userInitials)}" 
                   class="initials-box-settings">
            <div id="initials-settings-error" style="color:#D32F2F; font-size:0.7em; min-height:1em; margin-top:2px;"></div>
            <label style="display:flex; align-items:center; gap:5px; font-size:0.7em; color:#888; margin-top:4px; cursor:pointer;">
                <input type="checkbox" id="lb-optout" ${leaderboardOptOut ? 'checked' : ''}>
                Hide me from leaderboards
            </label>
            ${schoolHTML}
        </div>` : '';

    document.getElementById('modal-body').innerHTML = `
        <div class="menu-3col">
            <div class="menu-col">
                <div class="menu-label">Book</div>
                <select id="book-select" class="modal-select">${bookOptions}</select>
                <div class="menu-label" style="margin-top:8px;">Chapter</div>
                ${showChapFilter ? `
                <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
                    <input type="text" id="chapter-filter" class="modal-select"
                           placeholder="Search ${chapBuild.total} chapters\u2026"
                           autocomplete="off" style="margin:0; flex-grow:1;">
                    <span id="chapter-filter-status" style="font-size:0.7em; color:#888; min-width:52px;"></span>
                </div>` : ''}
                <div style="display:flex; gap:6px;">
                    <select id="chapter-nav-select" class="modal-select" style="margin:0; flex-grow:1;">${chapterOptions}</select>
                    <button id="go-btn" class="modal-btn" style="width:auto; padding:0 12px; font-size:13px;">Go</button>
                </div>
            </div>
            <div class="menu-col">
                <div class="menu-label">Sprint</div>
                <select id="sprint-select" class="modal-select">${getSessionOptionsHTML()}</select>
                <div class="menu-label" style="margin-top:8px;">Keyboard</div>
                <select id="layout-select" class="modal-select">
                    <option value="qwerty" ${currentLayout === 'qwerty' ? 'selected' : ''}>QWERTY</option>
                    <option value="dvorak" ${currentLayout === 'dvorak' ? 'selected' : ''}>Dvorak</option>
                </select>
                <div class="menu-label" style="margin-top:8px;">View</div>
                <select id="view-select" class="modal-select">
                    <option value="classic" ${VIEW_MODE === 'classic' ? 'selected' : ''}>Classic</option>
                    <option value="adventure" ${VIEW_MODE === 'adventure' ? 'selected' : ''}>Adventure</option>
                </select>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.7em; color:#888; margin-top:4px; cursor:pointer;">
                    <input type="checkbox" id="view-ask-each" ${viewRemember ? '' : 'checked'}>
                    Ask me for each new book
                </label>
            </div>
            <div class="menu-col menu-col-guide">
                <div class="menu-label">Hand Guide</div>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.8em; color:#ccc; cursor:pointer; margin-top:4px;">
                    <input type="checkbox" id="guide-toggle" ${handGuideEnabled ? 'checked' : ''}>
                    Show fingers
                </label>
                <label style="display:flex; align-items:center; gap:5px; font-size:0.8em; color:#ccc; cursor:pointer; margin-top:4px;">
                    <input type="checkbox" id="guide-rainbow" ${handGuideRainbow ? 'checked' : ''}>
                    🌈 Rainbow
                </label>
                <div id="guide-color-row" style="display:${handGuideRainbow ? 'none' : 'flex'}; align-items:center; gap:5px; margin-top:4px;">
                    <input type="color" id="guide-color" value="${handGuideColor}" 
                        style="width:28px; height:22px; border:1px solid #555; border-radius:3px; cursor:pointer; background:none; padding:0;">
                    <span style="font-size:0.7em; color:#888;">Color</span>
                </div>
            </div>
            ${initialsHTML}
        </div>
    `;

    document.getElementById('layout-select').onchange = (e) => {
        setKeyboardLayout(e.target.value);
    };

    // ─── Adventure: view mode toggle ───
    // v3.5.0: swaps in place. This used to save progress and call
    // location.reload(), which was tolerable for a deliberate settings change
    // but not for the boot-time reconciliation that now shares this code path.
    // applyViewMode() replays textLoaded + positionSet into a freshly mounted
    // renderer, so the student stays exactly where they were.
    document.getElementById('view-select').onchange = async (e) => {
        const ok = await applyViewMode(e.target.value, { replay: true, persist: true });
        if (!ok) e.target.value = 'classic';   // module failed to load
    };

    document.getElementById('view-ask-each').onchange = async (e) => {
        await saveViewMode(VIEW_MODE, !e.target.checked);
        // Re-arm the per-book prompt for the book they're in right now,
        // otherwise ticking the box appears to do nothing until they switch.
        if (!viewRemember) { try { sessionStorage.removeItem(SPLASH_BOOK_KEY); } catch (_) {} }
    };

    document.getElementById('sprint-select').onchange = (e) => {
        sessionValueStr = e.target.value;
        sessionLimit = (sessionValueStr === 'infinity') ? 'infinity' : parseInt(sessionValueStr);
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
    };

    // Hand guide controls
    document.getElementById('guide-toggle').onchange = (e) => {
        handGuideEnabled = e.target.checked;
        localStorage.setItem('ttb_handGuide', handGuideEnabled);
        const guide = document.getElementById('hand-guide-overlay');
        if (guide) guide.classList.toggle('hidden', !handGuideEnabled);
        if (handGuideEnabled) { createHandGuide(); }
        else { colorKeyboardKeys(); }
    };
    document.getElementById('guide-rainbow').onchange = (e) => {
        handGuideRainbow = e.target.checked;
        localStorage.setItem('ttb_handGuideRainbow', handGuideRainbow);
        const colorRow = document.getElementById('guide-color-row');
        if (colorRow) colorRow.style.display = handGuideRainbow ? 'none' : 'flex';
    };
    document.getElementById('guide-color').oninput = (e) => {
        handGuideColor = e.target.value;
        localStorage.setItem('ttb_handGuideColor', handGuideColor);
    };

    const initialsInput = document.getElementById('initials-input');
    if (initialsInput) {
        initialsInput.onblur = async () => {
            const val = initialsInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
            const errEl = document.getElementById('initials-settings-error');
            if (val && !isInitialsClean(val)) {
                if (errEl) errEl.textContent = "Not allowed — try again";
                initialsInput.value = userInitials; // revert
                return;
            }
            if (errEl) errEl.textContent = '';
            if (val && val !== userInitials) {
                userInitials = val;
                initialsInput.value = val;
                await saveInitials(val);
            }
        };
    }

    const optOutBox = document.getElementById('lb-optout');
    if (optOutBox) {
        optOutBox.onchange = async () => {
            leaderboardOptOut = optOutBox.checked;
            await saveInitials(userInitials);
            leaderboardCacheTime = 0; // bust cache
            // Push the flag to the public leaderboard doc right now. Waiting for
            // the next sprint-end flush would leave a student who opted out and
            // closed the tab still listed.
            if (lbOwnEntry) {
                lbOwnEntry.leaderboardOptOut = leaderboardOptOut;
                lbDirty = true;
                await flushLeaderboard();
            }
        };
    }

    document.getElementById('book-select').onchange = async (e) => {
        const newBookId = e.target.value;
        if (newBookId === currentBookId) return;

        // Save current book's progress first
        await saveProgress(true);

        // Switch to new book
        currentBookId = newBookId;
        localStorage.setItem('currentBookId', currentBookId);
        const newUrl = `game.html?book=${encodeURIComponent(currentBookId)}`;
        window.history.replaceState(null, '', newUrl);

        // Load new book's metadata
        await loadBookMetadata();

        // Peek at saved progress (without loading chapter)
        let resumeChapter = 1;
        let resumeChar = 0;
        if (currentUser && !currentUser.isAnonymous) {
            try {
                const progSnap = await getDoc(doc(db, "users", currentUser.uid, "progress", currentBookId));
                if (progSnap.exists()) {
                    const data = progSnap.data();
                    if (data.chapter !== undefined && data.chapter !== null) resumeChapter = data.chapter;
                    if (data.charIndex !== undefined) resumeChar = data.charIndex;
                }
            } catch (e) { console.warn("Progress peek error:", e); }
        }

        // Rebuild the chapter dropdown for the new book. Same builder as the
        // initial render — this used to be a second, drifted copy that dropped
        // the ✓ ticks and relabelled "Ch." to "Chapter".
        const chapSelect = document.getElementById('chapter-nav-select');
        const rebuilt = buildChapterOptions(resumeChapter, '');
        if (chapSelect) chapSelect.innerHTML = rebuilt.html;

        // The filter belongs to the OLD book's chapter count, so re-decide it.
        const cfWrap = document.getElementById('chapter-filter');
        if (cfWrap) {
            cfWrap.value = '';
            cfWrap.placeholder = `Search ${rebuilt.total} chapters\u2026`;
            const st = document.getElementById('chapter-filter-status');
            if (st) st.textContent = '';
        }

        // Update state but don't load chapter yet — user hits Go
        currentChapterNum = resumeChapter;
        savedCharIndex = resumeChar;
        lastSavedIndex = resumeChar;
        currentCharIndex = 0;

        textStream.innerHTML = `<span style="color:#888;">Switched to <b>${escapeHtml(bookMetadata.title || currentBookId)}</b>. Pick a chapter and hit Go.</span>`;
        bookSwitchPending = true;
        isInputBlocked = true;
    };

    // "No school" is a valid permanent state, not a prompt to fix something —
    // never nag, never block, and never auto-select the first school.
    const schoolSel = document.getElementById('school-select');
    if (schoolSel) {
        schoolSel.onchange = async (e) => {
            const st = document.getElementById('school-status');
            const val = e.target.value;
            if (st) { st.textContent = 'Saving\u2026'; st.style.color = '#888'; }
            const ok = await saveStudentSchool(val);
            if (!st) return;
            if (!ok) { st.textContent = "Couldn't save."; st.style.color = '#D32F2F'; return; }
            st.textContent = val ? '\u2713 Saved' : '\u2713 No school';
            st.style.color = '#2E7D32';
            setTimeout(() => { if (st) st.textContent = ''; }, 2500);
        };
    }

    wireChapterFilter('chapter-filter', 'chapter-nav-select', 'chapter-filter-status', 'go-btn');

    document.getElementById('go-btn').onclick = () => {
        const val = document.getElementById('chapter-nav-select').value;
        if (!val) return;                       // "No chapters match" is not a target
        if (bookSwitchPending) {
            // After a book switch, just load the chapter — no restart prompt
            bookSwitchPending = false;
            // If they picked a different chapter than their saved one, reset position
            if (val != currentChapterNum) {
                savedCharIndex = 0;
            }
            currentChapterNum = val;
            currentCharIndex = 0;
            lastSavedIndex = 0;
            closeModal();
            textStream.innerHTML = "Loading...";
            loadChapter(val);
        } else if (val != currentChapterNum) {
            handleChapterSwitch(val);
        } else {
            if(confirm(`Restart Chapter ${val}?`)) switchChapterHot(val);
        }
    };

    const btn = document.getElementById('action-btn');
    btn.innerText = "Close";
    btn.onclick = () => {
        if (bookSwitchPending) {
            // They switched books but didn't hit Go — load the chapter first
            bookSwitchPending = false;
            const val = document.getElementById('chapter-nav-select').value;
            currentChapterNum = val;
            currentCharIndex = 0;
            lastSavedIndex = 0;
            closeModal();
            loadChapter(val);
        } else {
            closeModal();
            createHandGuide();
            if (!isGameActive) startGame();
        }
    };
    btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    showModalPanel();
}

function handleChapterSwitch(newChapter) {
    if (newChapter != currentChapterNum) switchChapterHot(newChapter);
    else if(confirm(`Go back to Chapter ${newChapter}?`)) switchChapterHot(newChapter);
}

async function switchChapterHot(newChapter) {
    if (currentUser && !currentUser.isAnonymous) {
        await setDoc(doc(db, "users", currentUser.uid, "progress", currentBookId), {
            chapter: newChapter, charIndex: 0
        }, { merge: true });
    }
    currentChapterNum = newChapter; savedCharIndex = 0; currentCharIndex = 0; lastSavedIndex = 0;
    closeModal(); textStream.innerHTML = "Switching..."; loadChapter(newChapter);
}

// --- KEYBOARD LAYOUTS ---
const LAYOUTS = {
    qwerty: {
        numRow:      ['`','1','2','3','4','5','6','7','8','9','0','-','='],
        numShiftRow: ['~','!','@','#','$','%','^','&','*','(',')','_','+'],
        rows:      [['q','w','e','r','t','y','u','i','o','p','[',']','\\'],['a','s','d','f','g','h','j','k','l',';',"'"],['z','x','c','v','b','n','m',',','.','/']],
        shiftRows: [['Q','W','E','R','T','Y','U','I','O','P','{','}','|'],['A','S','D','F','G','H','J','K','L',':','"'],['Z','X','C','V','B','N','M','<','>','?']]
    },
    dvorak: {
        numRow:      ['`','1','2','3','4','5','6','7','8','9','0','[',']'],
        numShiftRow: ['~','!','@','#','$','%','^','&','*','(',')' ,'{','}'],
        rows:      [["'",',','.','p','y','f','g','c','r','l','/','+','\\'],['a','o','e','u','i','d','h','t','n','s','-'],[';','q','j','k','x','b','m','w','v','z']],
        shiftRows: [['"','<','>','P','Y','F','G','C','R','L','?','=','|'],['A','O','E','U','I','D','H','T','N','S','_'],[':', 'Q','J','K','X','B','M','W','V','Z']]
    }
};

let currentLayout = localStorage.getItem('keyboardLayout') || 'qwerty';
let numRow = LAYOUTS[currentLayout].numRow;
let numShiftRow = LAYOUTS[currentLayout].numShiftRow;
let rows = LAYOUTS[currentLayout].rows;
let shiftRows = LAYOUTS[currentLayout].shiftRows;

function setKeyboardLayout(layout) {
    if (!LAYOUTS[layout]) return;
    currentLayout = layout;
    localStorage.setItem('keyboardLayout', layout);
    numRow = LAYOUTS[layout].numRow;
    numShiftRow = LAYOUTS[layout].numShiftRow;
    rows = LAYOUTS[layout].rows;
    shiftRows = LAYOUTS[layout].shiftRows;
    createKeyboard();
    buildFingerMap();
    // Recreate hand guide overlay for new key positions
    const old = document.getElementById('hand-guide-overlay');
    if (old) old.remove();
    createHandGuide();
    highlightCurrentChar();
}

function createKeyboard() {
    keyboardDiv.innerHTML = '';

    // Number row: dual-character keys + BACK
    const numDiv = document.createElement('div'); numDiv.className = 'kb-row';
    numRow.forEach((char, i) => {
        const key = document.createElement('div');
        key.className = 'key key-num';
        key.dataset.char = char;
        key.dataset.shift = numShiftRow[i];
        key.id = `key-${char}`;
        key.innerHTML = `<span class="num-symbol">${escapeHtml(numShiftRow[i])}</span><span class="num-digit">${escapeHtml(char)}</span>`;
        numDiv.appendChild(key);
    });
    addSpecialKey(numDiv, "BACK", null, 53);
    keyboardDiv.appendChild(numDiv);

    // Letter rows
    rows.forEach((rowChars, rIndex) => {
        const rowDiv = document.createElement('div'); rowDiv.className = 'kb-row';
        if (rIndex === 0) addSpecialKey(rowDiv, "TAB", null, 72);
        if (rIndex === 1) addSpecialKey(rowDiv, "CAPS", null, 80);
        if (rIndex === 2) addSpecialKey(rowDiv, "SHIFT", "key-SHIFT-L", 100);
        rowChars.forEach((char, cIndex) => {
            const key = document.createElement('div'); key.className = 'key'; key.innerText = char; key.dataset.char = char; key.dataset.shift = shiftRows[rIndex][cIndex]; key.id = `key-${char}`; rowDiv.appendChild(key);
        });
        if (rIndex === 1) addSpecialKey(rowDiv, "ENTER", null, 80);
        if (rIndex === 2) addSpecialKey(rowDiv, "SHIFT", "key-SHIFT-R", 100);
        keyboardDiv.appendChild(rowDiv);
    });

    // Space row
    const spaceRow = document.createElement('div'); spaceRow.className = 'kb-row';
    const space = document.createElement('div'); space.className = 'key space'; space.innerText = ""; space.id = "key- ";
    spaceRow.appendChild(space); keyboardDiv.appendChild(spaceRow);
}

function addSpecialKey(parent, text, customId, width) {
    const key = document.createElement('div'); key.className = 'key wide'; key.innerText = text;
    key.id = customId || `key-${text}`;
    if (width) key.style.width = width + 'px';
    parent.appendChild(key);
}

function toggleKeyboardCase(isShift) {
    document.querySelectorAll('.key').forEach(k => {
        if (k.classList.contains('key-num')) return; // number keys always show both
        if (k.dataset.char) k.innerText = isShift ? k.dataset.shift : k.dataset.char;
        if (k.id === 'key-SHIFT-L' || k.id === 'key-SHIFT-R') isShift ? k.classList.add('shift-active') : k.classList.remove('shift-active');
    });
}

function highlightKey(char) {
    document.querySelectorAll('.key').forEach(k => k.classList.remove('target'));
    let targetId = ''; let needsShift = false;
    if (char === ' ') targetId = 'key- '; else if (char === '\t') targetId = 'key-TAB'; else if (char === '\n') targetId = 'key-ENTER';
    else {
        const keys = Array.from(document.querySelectorAll('.key'));
        const found = keys.find(k => k.dataset.char === char || k.dataset.shift === char);
        if (found) { targetId = found.id; if (found.dataset.shift === char) needsShift = true; }
    }
    const el = document.getElementById(targetId); if (el) el.classList.add('target');
    toggleKeyboardCase(needsShift);
}

function flashKey(char) {
    let targetId = '';
    if (char === ' ') targetId = 'key- '; else if (char === '\t' || char === 'Tab') targetId = 'key-TAB'; else if (char === '\\n' || char === 'Enter') targetId = 'key-ENTER';
    else {
        const keys = Array.from(document.querySelectorAll('.key'));
        const found = keys.find(k => k.dataset.char === char || k.dataset.shift === char);
        if (found) targetId = found.id;
    }
    const el = document.getElementById(targetId);
    if (el) {
        el.style.backgroundColor = 'var(--brute-force-color)';
        setTimeout(() => {
            // Always restore to correct finger color (key colors show regardless of hand guide toggle)
            if (el.id === 'key- ') {
                el.style.backgroundColor = handGuideRainbow ? '#d0d0d0' : handGuideColor + '38';
                return;
            }
            if (el.id === 'key-ENTER' || el.id === 'key-BACK') {
                el.style.backgroundColor = getFingerColor('right-pinky') + '38'; return;
            }
            if (el.id === 'key-TAB') {
                el.style.backgroundColor = getFingerColor('left-pinky') + '38'; return;
            }
            if (el.id === 'key-SHIFT-L' || el.id === 'key-CAPS') {
                el.style.backgroundColor = getFingerColor('left-pinky') + '38'; return;
            }
            if (el.id === 'key-SHIFT-R') {
                el.style.backgroundColor = getFingerColor('right-pinky') + '38'; return;
            }
            const keyChar = el.dataset.char || '';
            const info = fingerMap[keyChar];
            if (info && info.finger && info.finger !== 'thumb') {
                el.style.backgroundColor = getFingerColor(info.finger) + '38';
            } else { el.style.backgroundColor = ''; }
        }, 200);
    }
}

// ========================
// HAND GUIDE (keyboard overlay - capsule fingers)
// ========================

function getHomeKeys() {
    const r = rows[1]; // home row
    return {
        'left-pinky':  r[0],  'left-ring':   r[1],  'left-middle': r[2],  'left-index':  r[3],
        'right-index': r[6],  'right-middle':r[7],  'right-ring':  r[8],  'right-pinky': r[9],
    };
}

const FINGER_NAMES = ['left-pinky','left-ring','left-middle','left-index',
                      'right-index','right-middle','right-ring','right-pinky'];

function buildFingerMap() {
    fingerMap = {};

    // Number row finger assignments
    const numAssign = ['left-pinky','left-pinky','left-ring','left-middle','left-index','left-index',
                       'right-index','right-index','right-middle','right-ring','right-pinky','right-pinky','right-pinky'];
    numRow.forEach((char, i) => {
        if (i >= numAssign.length) return;
        fingerMap[char] = { finger: numAssign[i], keyChar: char };
        if (numShiftRow[i]) {
            fingerMap[numShiftRow[i]] = { finger: numAssign[i], keyChar: char, shift: true };
        }
    });

    // Letter row finger assignments
    const assignments = [
        // Row 0 (top): up to 13 keys
        ['left-pinky','left-ring','left-middle','left-index','left-index',
         'right-index','right-index','right-middle','right-ring','right-pinky',
         'right-pinky','right-pinky','right-pinky'],
        // Row 1 (home): up to 11 keys
        ['left-pinky','left-ring','left-middle','left-index','left-index',
         'right-index','right-index','right-middle','right-ring','right-pinky','right-pinky'],
        // Row 2 (bottom): up to 10 keys
        ['left-pinky','left-ring','left-middle','left-index','left-index',
         'right-index','right-index','right-middle','right-ring','right-pinky'],
    ];
    rows.forEach((rowChars, rIndex) => {
        const assign = assignments[rIndex];
        if (!assign) return;
        rowChars.forEach((char, cIndex) => {
            if (cIndex >= assign.length) return;
            fingerMap[char] = { finger: assign[cIndex], keyChar: char };
            if (shiftRows[rIndex] && shiftRows[rIndex][cIndex]) {
                fingerMap[shiftRows[rIndex][cIndex]] = { finger: assign[cIndex], keyChar: char, shift: true };
            }
        });
    });
    fingerMap[' '] = { finger: 'thumb', keyChar: ' ' };
    fingerMap['\n'] = { finger: 'right-pinky', keyChar: 'ENTER' };
    fingerMap['\t'] = { finger: 'left-pinky', keyChar: 'TAB' };
}

function getFingerInfo(char) {
    if (fingerMap[char]) return fingerMap[char];
    const lower = char.toLowerCase();
    if (lower !== char && fingerMap[lower]) return { ...fingerMap[lower], shift: true };
    return null;
}

function getKeyCenterInKB(charOrId) {
    const kb = document.getElementById('virtual-keyboard');
    if (!kb) return null;
    let keyEl;
    if (charOrId === ' ') keyEl = document.getElementById('key- ');
    else if (charOrId === 'ENTER') keyEl = document.getElementById('key-ENTER');
    else if (charOrId === 'SHIFT-L') keyEl = document.getElementById('key-SHIFT-L');
    else if (charOrId === 'SHIFT-R') keyEl = document.getElementById('key-SHIFT-R');
    else keyEl = document.getElementById(`key-${charOrId}`);
    if (!keyEl) return null;
    const kbRect = kb.getBoundingClientRect();
    const keyRect = keyEl.getBoundingClientRect();
    // Offset by border so SVG coords align with overlay (which sits inside border)
    return {
        x: keyRect.left - kbRect.left - kb.clientLeft + keyRect.width / 2,
        y: keyRect.top - kbRect.top - kb.clientTop + keyRect.height / 2
    };
}

function createHandGuide() {
    const old = document.getElementById('hand-guide-overlay');
    if (old) old.remove();
    const kb = document.getElementById('virtual-keyboard');
    if (!kb) return;
    kb.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.id = 'hand-guide-overlay';
    if (!handGuideEnabled) overlay.classList.add('hidden');
    overlay.innerHTML = `<svg id="hg-svg" xmlns="http://www.w3.org/2000/svg"></svg>`;
    kb.appendChild(overlay);

    colorKeyboardKeys();
    requestAnimationFrame(() => buildFingerSVG());
}

function colorKeyboardKeys() {
    // Reset all keys
    document.querySelectorAll('.key').forEach(k => { k.style.backgroundColor = ''; });

    // Color each key based on its finger assignment
    Object.entries(fingerMap).forEach(([char, info]) => {
        if (!info.finger || info.shift || info.finger === 'thumb') return;
        const color = getFingerColor(info.finger);
        if (!color) return;
        let keyEl;
        if (char === ' ') keyEl = document.getElementById('key- ');
        else if (char === '\n') keyEl = document.getElementById('key-ENTER');
        else if (char === '\t') keyEl = document.getElementById('key-TAB');
        else keyEl = document.getElementById(`key-${char}`);
        if (keyEl) keyEl.style.backgroundColor = color + '38';
    });

    // Space bar: grey for rainbow, user color tint for single color
    const spaceEl = document.getElementById('key- ');
    if (spaceEl) {
        if (handGuideRainbow) {
            spaceEl.style.backgroundColor = '#d0d0d0';
        } else {
            spaceEl.style.backgroundColor = handGuideColor + '38';
        }
    }

    // Color special keys by their pinky finger
    const lp = getFingerColor('left-pinky') + '38';
    const rp = getFingerColor('right-pinky') + '38';
    const el = id => document.getElementById(id);
    if (el('key-TAB')) el('key-TAB').style.backgroundColor = lp;
    if (el('key-CAPS')) el('key-CAPS').style.backgroundColor = lp;
    if (el('key-SHIFT-L')) el('key-SHIFT-L').style.backgroundColor = lp;
    if (el('key-SHIFT-R')) el('key-SHIFT-R').style.backgroundColor = rp;
    if (el('key-ENTER')) el('key-ENTER').style.backgroundColor = rp;
    if (el('key-BACK')) el('key-BACK').style.backgroundColor = rp;
}

function buildFingerSVG() {
    const kb = document.getElementById('virtual-keyboard');
    const svg = document.getElementById('hg-svg');
    if (!kb || !svg) return;
    svg.innerHTML = '';
    svg.setAttribute('width', kb.clientWidth);
    svg.setAttribute('height', kb.clientHeight);
    svg.setAttribute('viewBox', `0 0 ${kb.clientWidth} ${kb.clientHeight}`);

    const homeKeys = getHomeKeys();
    const R = 11; // finger circle radius

    // Create each finger group: home circle + reach body + reach tip
    FINGER_NAMES.forEach(name => {
        const pos = getKeyCenterInKB(homeKeys[name]);
        if (!pos) return;
        const fc = getFingerColor(name);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = `hg-finger-${name}`;
        g.classList.add('hg-finger-group');
        g.style.setProperty('--fc', fc);

        // Reach body (thick line with round caps = capsule connector)
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        body.classList.add('hg-body');
        body.setAttribute('x1', pos.x); body.setAttribute('y1', pos.y);
        body.setAttribute('x2', pos.x); body.setAttribute('y2', pos.y);
        body.setAttribute('stroke-width', R * 2);
        body.setAttribute('stroke-linecap', 'round');
        g.appendChild(body);

        // Home circle (base of finger - always visible)
        const home = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        home.classList.add('hg-home');
        home.setAttribute('cx', pos.x); home.setAttribute('cy', pos.y);
        home.setAttribute('r', R);
        g.appendChild(home);

        // Fingertip circle (target end - only visible when reaching)
        const tip = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        tip.classList.add('hg-tip');
        tip.setAttribute('cx', pos.x); tip.setAttribute('cy', pos.y);
        tip.setAttribute('r', R);
        g.appendChild(tip);

        svg.appendChild(g);
    });

    updateHandGuide();
}

function updateHandGuide() {
    if (!handGuideEnabled) return;
    const svg = document.getElementById('hg-svg');
    if (!svg || !fullText || currentCharIndex >= fullText.length) return;

    const nextChar = fullText[currentCharIndex];
    const info = getFingerInfo(nextChar);
    const homeKeys = getHomeKeys();

    // Clear space bar highlight
    const spaceKeyReset = document.getElementById('key- ');
    if (spaceKeyReset) spaceKeyReset.classList.remove('space-active');

    // Reset all fingers to resting state
    svg.querySelectorAll('.hg-finger-group').forEach(g => {
        g.classList.remove('hg-active', 'hg-shift-active');
        const body = g.querySelector('.hg-body');
        const home = g.querySelector('.hg-home');
        const tip = g.querySelector('.hg-tip');
        const name = g.id.replace('hg-finger-', '');

        // Reset position to home
        const homePos = getKeyCenterInKB(homeKeys[name]);
        if (!homePos) return;
        if (body) {
            body.setAttribute('x1', homePos.x); body.setAttribute('y1', homePos.y);
            body.setAttribute('x2', homePos.x); body.setAttribute('y2', homePos.y);
        }
        if (tip) { tip.setAttribute('cx', homePos.x); tip.setAttribute('cy', homePos.y); }
    });

    if (!info) return;

    // Space: just highlight the bar (CSS handles thumb circles via ::before/::after)
    if (info.finger === 'thumb') {
        const spaceBar = document.getElementById('key- ');
        if (spaceBar) spaceBar.classList.add('space-active');
        return;
    }

    const fingerName = info.finger;
    const fingerG = document.getElementById(`hg-finger-${fingerName}`);
    if (!fingerG) return;

    // Find home and target positions
    const homeChar = homeKeys[fingerName];
    const homePos = homeChar ? getKeyCenterInKB(homeChar) : null;
    const targetPos = getKeyCenterInKB(info.keyChar);

    if (!homePos || !targetPos) return;

    // Stretch the finger from home to target
    const body = fingerG.querySelector('.hg-body');
    const tip = fingerG.querySelector('.hg-tip');
    if (body) {
        body.setAttribute('x1', homePos.x); body.setAttribute('y1', homePos.y);
        body.setAttribute('x2', targetPos.x); body.setAttribute('y2', targetPos.y);
    }
    if (tip) { tip.setAttribute('cx', targetPos.x); tip.setAttribute('cy', targetPos.y); }
    fingerG.classList.add('hg-active');

    // Shift: stretch opposite pinky to correct shift key
    if (info.shift) {
        const isLeftFinger = fingerName.startsWith('left');
        const shiftHand = isLeftFinger ? 'right' : 'left';
        const shiftKey = isLeftFinger ? 'SHIFT-R' : 'SHIFT-L';
        const shiftFingerG = document.getElementById(`hg-finger-${shiftHand}-pinky`);
        if (shiftFingerG) {
            const shiftHome = homeKeys[`${shiftHand}-pinky`];
            const shiftHomePos = shiftHome ? getKeyCenterInKB(shiftHome) : null;
            const shiftTargetPos = getKeyCenterInKB(shiftKey);
            if (shiftHomePos && shiftTargetPos) {
                const sBody = shiftFingerG.querySelector('.hg-body');
                const sTip = shiftFingerG.querySelector('.hg-tip');
                if (sBody) {
                    sBody.setAttribute('x1', shiftHomePos.x); sBody.setAttribute('y1', shiftHomePos.y);
                    sBody.setAttribute('x2', shiftTargetPos.x); sBody.setAttribute('y2', shiftTargetPos.y);
                }
                if (sTip) { sTip.setAttribute('cx', shiftTargetPos.x); sTip.setAttribute('cy', shiftTargetPos.y); }
            }
            shiftFingerG.classList.add('hg-shift-active');
        }
    }
}

function flashFingerPressed() {
    if (!handGuideEnabled) return;
    const svg = document.getElementById('hg-svg');
    if (!svg) return;
    svg.querySelectorAll('.hg-active').forEach(g => {
        g.classList.add('hg-pressed');
        setTimeout(() => g.classList.remove('hg-pressed'), 120);
    });
    // Flash space bar on press
    const spaceKey = document.getElementById('key- ');
    if (spaceKey && spaceKey.classList.contains('space-active')) {
        spaceKey.classList.add('space-pressed');
        setTimeout(() => spaceKey.classList.remove('space-pressed'), 120);
    }
}

let hgResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(hgResizeTimer);
    hgResizeTimer = setTimeout(() => {
        const old = document.getElementById('hand-guide-overlay');
        if (old) old.remove();
        createHandGuide();
    }, 200);
});

// --- CELEBRATIONS ---
function createCelebrationCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    return canvas;
}

function launchConfetti() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const colors = ['#4B9CD3','#FFD700','#FF6B6B','#22c55e','#FF69B4','#FFA500','#9B59B6','#00CED1'];
    const pieces = [];

    for (let i = 0; i < 150; i++) {
        pieces.push({
            x: W * 0.5 + (Math.random() - 0.5) * W * 0.6,
            y: -20 - Math.random() * 100,
            w: 6 + Math.random() * 6,
            h: 10 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.15,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 3,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.03 + Math.random() * 0.05
        });
    }

    // Show toast
    showGoalToast("🎉 Daily Goal Reached!", "#22c55e");

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, W, H);
        let alive = false;
        pieces.forEach(p => {
            p.x += p.vx + Math.sin(p.wobble) * 0.5;
            p.y += p.vy;
            p.vy += 0.04; // gravity
            p.rotation += p.rotSpeed;
            p.wobble += p.wobbleSpeed;
            p.vx *= 0.99;
            if (p.y < H + 50) {
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - (frame / 200));
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
        });
        frame++;
        if (alive && frame < 250) requestAnimationFrame(animate);
        else canvas.remove();
    }
    requestAnimationFrame(animate);
}

function launchFireworks() {
    const canvas = createCelebrationCanvas();
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const shells = [];
    const particles = [];
    const colors = ['#4B9CD3','#FFD700','#FF6B6B','#22c55e','#FF69B4','#FFA500','#9B59B6','#00CED1','#fff'];

    // Launch 5 shells staggered
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            shells.push({
                x: W * (0.2 + Math.random() * 0.6),
                y: H,
                vy: -(8 + Math.random() * 4),
                targetY: H * (0.15 + Math.random() * 0.35),
                color: colors[Math.floor(Math.random() * colors.length)],
                exploded: false
            });
        }, i * 400);
    }

    showGoalToast("🎆 Weekly Goal Reached!", "#FFD700");

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, W, H);

        // Update shells
        shells.forEach(s => {
            if (s.exploded) return;
            s.y += s.vy;
            s.vy += 0.12;
            // Trail
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            // Explode
            if (s.y <= s.targetY || s.vy >= 0) {
                s.exploded = true;
                const count = 60 + Math.floor(Math.random() * 40);
                const burstColor = s.color;
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
                    const speed = 2 + Math.random() * 4;
                    particles.push({
                        x: s.x, y: s.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        color: Math.random() > 0.3 ? burstColor : colors[Math.floor(Math.random() * colors.length)],
                        life: 1.0,
                        decay: 0.008 + Math.random() * 0.012,
                        size: 1.5 + Math.random() * 2
                    });
                }
            }
        });

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04;
            p.vx *= 0.98;
            p.life -= p.decay;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        frame++;
        const allExploded = shells.length >= 5 && shells.every(s => s.exploded);
        if (frame < 400 && !(allExploded && particles.length === 0)) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }
    requestAnimationFrame(animate);
}

function showGoalToast(message, color) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: ${color}; color: #000; font-family: 'Courier Prime', monospace;
        font-weight: 700; font-size: 1.2rem; padding: 14px 28px;
        border-radius: 8px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        animation: toastIn 0.4s ease-out;
    `;
    // Add keyframes if not already present
    if (!document.getElementById('toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'toast-keyframes';
        style.textContent = `
            @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
            @keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(-20px); } }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.5s ease-in forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Find the start position of the sentence containing pos. Used by hard-stop
// to roll the cursor back to the start of the failed sentence — user retypes.
// Mirrors the boundary logic in getSentenceMap.
function findSentenceStartFor(pos) {
    if (!fullText || pos <= 0) return 0;
    let i = Math.min(pos, fullText.length - 1);
    while (i > 0) {
        const ch = fullText[i - 1];
        const next = fullText[i];
        if (ch === '\n') return i;
        if ((ch === '.' || ch === '!' || ch === '?') &&
            (next === ' ' || next === '\n')) {
            // Skip past whitespace and any closing quote to land on the
            // next sentence's first real character.
            let j = i;
            while (j < fullText.length &&
                   (fullText[j] === ' ' || fullText[j] === '\n' ||
                    fullText[j] === '\t' || fullText[j] === '"' ||
                    fullText[j] === "'")) {
                j++;
            }
            return j;
        }
        i--;
    }
    return 0;
}

// --- GAME GENIE (Admin Debug Tool) ---
function getSentenceMap() {
    const sentences = [];
    let sentStart = 0;
    for (let i = 0; i < fullText.length; i++) {
        const ch = fullText[i];
        if (ch === '.' || ch === '!' || ch === '?') {
            // Check if next char is space, newline, quote, or end
            const next = fullText[i + 1];
            if (!next || next === ' ' || next === '\n' || next === '"' || next === "'") {
                // Find the real end (include closing quote if present)
                let end = i + 1;
                if (next === '"' || next === "'") end = i + 2;
                sentences.push({ start: sentStart, end: Math.min(end, fullText.length) });
                // Skip whitespace to find next sentence start
                let j = end;
                while (j < fullText.length && (fullText[j] === ' ' || fullText[j] === '\n' || fullText[j] === '\t')) j++;
                sentStart = j;
            }
        } else if (ch === '\n' && i > sentStart) {
            // Paragraph break = sentence boundary
            sentences.push({ start: sentStart, end: i });
            let j = i + 1;
            while (j < fullText.length && (fullText[j] === ' ' || fullText[j] === '\n' || fullText[j] === '\t')) j++;
            sentStart = j;
        }
    }
    // Catch trailing text
    if (sentStart < fullText.length) {
        sentences.push({ start: sentStart, end: fullText.length });
    }
    return sentences;
}

function getCurrentSentence(sentences) {
    for (let i = 0; i < sentences.length; i++) {
        if (currentCharIndex < sentences[i].end) return i;
    }
    return sentences.length - 1;
}

function jumpToSentence(sentences, idx) {
    idx = Math.max(0, Math.min(idx, sentences.length - 1));
    const target = sentences[idx].start;
    
    // Reset game state
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }
    
    currentCharIndex = target;
    savedCharIndex = target;
    sprintCharStart = target;
    sprintSeconds = 0; sprintMistakes = 0;
    
    // Re-render and mark everything before current as done
    renderText();
    for (let i = 0; i < currentCharIndex; i++) {
        const el = document.getElementById(`char-${i}`);
        if (el) {
            el.classList.remove('active');
            if (!el.classList.contains('space') && !el.classList.contains('enter') && !el.classList.contains('tab')) {
                el.classList.add('done-perfect');
            }
        }
    }
    highlightCurrentChar();
    centerView();
    saveProgress();

    // Adventure mode: the renderer tracks position via events, so a Game
    // Genie warp must announce itself or the canvas keeps showing the old
    // spot while the (hidden) classic DOM moves.
    _ttbEmit('positionSet', { position: currentCharIndex });

    // Show start modal for this position
    showStartModal("Resume");
}

function openGameGenie() {
    if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) return;
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }
    
    // Save real position on first open (before any warps)
    if (ggRealCharIndex < 0) ggRealCharIndex = currentCharIndex;
    
    const sentences = getSentenceMap();
    const currentSent = getCurrentSentence(sentences);
    const pct = fullText.length > 0 ? Math.round((currentCharIndex / fullText.length) * 100) : 0;
    const realSent = (() => { for (let i = 0; i < sentences.length; i++) { if (ggRealCharIndex < sentences[i].end) return i; } return sentences.length - 1; })();
    const hasWarped = ggRealCharIndex !== currentCharIndex;
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.round(wordCount / 40); // ~40 WPM typing speed estimate
    const segCount = bookData ? bookData.segments.length : 0;
    const isInfinite = sessionValueStr === 'infinity';
    
    isModalOpen = true; isInputBlocked = false;
    modalGeneration++;
    setModalTitle('🔥 GAME GENIE 🔥');
    
    const ggBtn = 'background:#333; color:#ff6600; border:1px solid #ff6600; padding:4px 8px; cursor:pointer; font-family:inherit; border-radius:3px; font-size:0.8em;';
    
    // Build chapter options — third caller of the shared builder.
    const ggBuild  = buildChapterOptions(currentChapterNum, '');
    const chapOpts = ggBuild.html;
    const ggFilter = ggBuild.total > CHAPTER_FILTER_MIN;
    
    document.getElementById('modal-body').innerHTML = `
        <div style="font-family: 'Courier Prime', monospace; text-align: left; width: 60%; margin: 0 auto; font-size: 0.8em;">
            ${ggFilter ? `
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:4px;">
                <input type="text" id="gg-chapter-filter" placeholder="Search ${ggBuild.total} chapters\u2026"
                       autocomplete="off" style="flex:1; background:#f8f8f8; border:1px solid #ccc; padding:3px 4px; font-family:inherit; font-size:0.9em; border-radius:3px;">
                <span id="gg-chapter-filter-status" style="font-size:0.85em; color:#888; min-width:56px;"></span>
            </div>` : ''}
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                <select id="gg-chapter-select" style="flex:1; background:#f8f8f8; border:1px solid #ccc; padding:3px 4px; font-family:inherit; font-size:0.9em; border-radius:3px;">${chapOpts}</select>
                <button id="gg-chapter-go" style="${ggBtn}">Jump Ch.</button>
                <button id="gg-reset-ch" style="${ggBtn}" title="Reset to start of chapter">⟲ Reset</button>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-size:0.85em; color:#888;">
                <span>Char ${currentCharIndex.toLocaleString()} / ${fullText.length.toLocaleString()} · ${wordCount.toLocaleString()} words · ${segCount} segs · ~${estMinutes}min</span>
                <span>${pct}%</span>
            </div>
            <div id="gg-slider-track" style="height:12px; background:#eee; border-radius:6px; overflow:visible; margin-bottom:6px; cursor:pointer; position:relative;">
                <div id="gg-slider-fill" style="height:100%; width:${pct}%; background: linear-gradient(90deg, #ff6600, #ff0000, #ff6600); border-radius:6px; pointer-events:none;"></div>
                <div id="gg-slider-thumb" style="position:absolute; top:-2px; left:${pct}%; width:16px; height:16px; background:#ff6600; border:2px solid #fff; border-radius:50%; transform:translateX(-50%); cursor:grab; box-shadow:0 0 6px rgba(255,102,0,0.5);"></div>
            </div>
            
            <div style="display:flex; align-items:center; gap:4px; margin-bottom:6px;">
                <button id="gg-start" style="${ggBtn}">Start</button>
                <button id="gg-back10" style="${ggBtn}">-10</button>
                <button id="gg-back1" style="${ggBtn}">-1</button>
                <div style="flex:1; text-align:center; font-weight:bold;">
                    Sentence <span style="color:#ff6600;">${currentSent + 1}</span> / ${sentences.length}
                </div>
                <button id="gg-fwd1" style="${ggBtn}">+1</button>
                <button id="gg-fwd10" style="${ggBtn}">+10</button>
                <button id="gg-end" style="${ggBtn}">End</button>
            </div>
            
            <div style="display:flex; justify-content:center; gap:6px; align-items:center; margin-bottom:6px;">
                <label style="font-size:0.85em;">Warp #</label>
                <input id="gg-jump-input" type="number" min="1" max="${sentences.length}" value="${currentSent + 1}" 
                       style="width:60px; background:#f8f8f8; border:1px solid #ccc; padding:3px 4px; font-family:inherit; font-size:0.85em; border-radius:3px; text-align:center;">
                <button id="gg-jump-btn" style="background:#ff6600; color:#fff; border:none; padding:4px 10px; cursor:pointer; font-family:inherit; font-weight:bold; border-radius:3px; font-size:0.85em;">WARP</button>
                ${hasWarped ? `<button id="gg-return-btn" style="background:#224422; color:#88ff88; border:1px solid #44aa44; padding:4px 8px; cursor:pointer; font-family:inherit; border-radius:3px; font-size:0.75em;" title="Return to sentence ${realSent + 1}">↩ Return</button>` : ''}
            </div>
            
            <div id="gg-preview" style="font-size:0.8em; color:#888; background:#f5f5f5; padding:4px 6px; border-radius:3px; max-height:32px; overflow:hidden; line-height:1.3; margin-bottom:6px;">
                ${escapeHtml(fullText.substring(sentences[currentSent].start, sentences[currentSent].start + 120))}${sentences[currentSent].end - sentences[currentSent].start > 120 ? '...' : ''}
            </div>
            
            <div style="display:flex; justify-content:center; gap:6px; align-items:center;">
                <button id="gg-infinite" style="${isInfinite ? 'background:#ff6600; color:#fff;' : 'background:#333; color:#ff6600;'} border:1px solid #ff6600; padding:4px 12px; cursor:pointer; font-family:inherit; border-radius:3px; font-size:0.85em; font-weight:bold;" title="Toggle infinite session (no sprint timer)">${isInfinite ? '∞ INFINITE ON' : '∞ Infinite Mode'}</button>
            </div>
            
            <div style="margin-top:8px; padding-top:6px; border-top:1px solid #ddd;">
                <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
                    <div>
                        <div style="font-size:0.7em; color:#666; margin-bottom:3px;">Test Text</div>
                        <div style="display:flex; gap:4px;">
                            <button id="gg-test-pangram" style="${ggBtn}" title="All letters + numbers + quotes">🦊 Pangram</button>
                            <button id="gg-test-alphabet" style="${ggBtn}" title="A-Z + 0-9">🔤 ABC</button>
                        </div>
                    </div>
                    <div>
                        <div style="font-size:0.7em; color:#666; margin-bottom:3px;">Toggles</div>
                        <label style="display:flex; align-items:center; gap:3px; font-size:0.7em; color:${ggAllowMistakes ? '#ff6600' : '#888'}; cursor:pointer;">
                            <input type="checkbox" id="gg-allow-mistakes" ${ggAllowMistakes ? 'checked' : ''}> Mistakes OK
                        </label>
                        <label style="display:flex; align-items:center; gap:3px; font-size:0.7em; color:${ggBypassIdle ? '#ff6600' : '#888'}; cursor:pointer; margin-top:2px;">
                            <input type="checkbox" id="gg-bypass-idle" ${ggBypassIdle ? 'checked' : ''}> No Idle
                        </label>
                    </div>
                    <div>
                        <div style="font-size:0.7em; color:#666; margin-bottom:3px;">Debug</div>
                        <div style="display:flex; flex-direction:column; gap:3px;">
                            <button id="gg-reset-practice" style="${ggBtn}" title="Reset AI practice cooldown & count">✨ AI Reset</button>
                            <button id="gg-clear-missed" style="${ggBtn}" title="Clear missed characters map">🧹 Missed</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resetModalFooter();
    const btn = document.getElementById('action-btn');
    btn.innerText = 'Close'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    const ggClose = () => { ggRealCharIndex = -1; closeModal(); startGame(); };
    btn.onclick = ggClose;
    // Allow smart-start typing to close GG and begin typing
    modalActionCallback = ggClose;
    showModalPanel();
    
    // Wire up
    const s = sentences;
    const cur = currentSent;
    
    document.getElementById('gg-start').onclick = () => { jumpToSentence(s, 0); openGameGenie(); };
    document.getElementById('gg-back10').onclick = () => { jumpToSentence(s, cur - 10); openGameGenie(); };
    document.getElementById('gg-back1').onclick = () => { jumpToSentence(s, cur - 1); openGameGenie(); };
    document.getElementById('gg-fwd1').onclick = () => { jumpToSentence(s, cur + 1); openGameGenie(); };
    document.getElementById('gg-fwd10').onclick = () => { jumpToSentence(s, cur + 10); openGameGenie(); };
    document.getElementById('gg-end').onclick = () => { jumpToSentence(s, s.length - 1); openGameGenie(); };
    
    // Chapter jump
    wireChapterFilter('gg-chapter-filter', 'gg-chapter-select', 'gg-chapter-filter-status', 'gg-chapter-go');

    document.getElementById('gg-chapter-go').onclick = async () => {
        const targetChap = document.getElementById('gg-chapter-select').value;
        if (!targetChap) return;
        if (targetChap == currentChapterNum) return; // same chapter, do nothing
        ggRealCharIndex = -1;
        currentChapterNum = targetChap;
        savedCharIndex = 0; currentCharIndex = 0; lastSavedIndex = 0;
        if (currentUser && !currentUser.isAnonymous) {
            await setDoc(doc(db, "users", currentUser.uid, "progress", currentBookId), {
                chapter: currentChapterNum, charIndex: 0
            }, { merge: true });
        }
        closeModal();
        await loadChapter(targetChap);
        openGameGenie();
    };
    
    // Reset chapter
    document.getElementById('gg-reset-ch').onclick = () => {
        ggRealCharIndex = -1;
        jumpToSentence(s, 0);
        openGameGenie();
    };
    
    // Infinite mode toggle
    document.getElementById('gg-infinite').onclick = () => {
        if (sessionValueStr === 'infinity') {
            sessionValueStr = '30'; sessionLimit = 30;
        } else {
            sessionValueStr = 'infinity'; sessionLimit = 'infinity';
        }
        localStorage.setItem('ttb_sessionLength', sessionValueStr);
        openGameGenie(); // refresh UI
    };
    
    // Test text buttons
    document.getElementById('gg-test-pangram').onclick = () => {
        ggRealCharIndex = -1;
        closeModal();
        startTestText(TEST_TEXT_PANGRAM, 'Pangram');
    };
    document.getElementById('gg-test-alphabet').onclick = () => {
        ggRealCharIndex = -1;
        closeModal();
        startTestText(TEST_TEXT_ALPHABET, 'Alphabet');
    };
    document.getElementById('gg-allow-mistakes').onchange = (e) => {
        ggAllowMistakes = e.target.checked;
    };
    document.getElementById('gg-bypass-idle').onchange = (e) => {
        ggBypassIdle = e.target.checked;
    };
    document.getElementById('gg-reset-practice').onclick = () => {
        practiceTypingAccumulator = 9999;
        hasDonePractice = true;
        alert('AI practice unlocked! Cooldown reset. (Server-side 5/day limit still applies.)');
    };
    document.getElementById('gg-clear-missed').onclick = () => {
        missedCharsMap = {};
        alert('Missed characters cleared.');
    };
    
    // Return button
    if (document.getElementById('gg-return-btn')) {
        document.getElementById('gg-return-btn').onclick = () => {
            const realIdx = ggRealCharIndex;
            ggRealCharIndex = -1;
            currentCharIndex = realIdx;
            savedCharIndex = realIdx;
            sprintCharStart = realIdx;
            renderText();
            for (let i = 0; i < currentCharIndex; i++) {
                const el = document.getElementById(`char-${i}`);
                if (el) { el.classList.remove('active'); if (!el.classList.contains('space') && !el.classList.contains('enter') && !el.classList.contains('tab')) el.classList.add('done-perfect'); }
            }
            highlightCurrentChar(); centerView(); saveProgress();
            openGameGenie();
        };
    }
    
    // Warp input
    document.getElementById('gg-jump-btn').onclick = () => {
        const target = parseInt(document.getElementById('gg-jump-input').value) - 1;
        if (!isNaN(target)) { jumpToSentence(s, target); openGameGenie(); }
    };
    document.getElementById('gg-jump-input').oninput = () => {
        const target = parseInt(document.getElementById('gg-jump-input').value) - 1;
        if (!isNaN(target) && target >= 0 && target < s.length) {
            const preview = document.getElementById('gg-preview');
            if (preview) {
                preview.textContent = fullText.substring(s[target].start, s[target].start + 120) + (s[target].end - s[target].start > 120 ? '...' : '');
            }
        }
    };
    document.getElementById('gg-jump-input').onkeydown = (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); document.getElementById('gg-jump-btn').click(); }
    };
    
    // Draggable slider
    const track = document.getElementById('gg-slider-track');
    const thumb = document.getElementById('gg-slider-thumb');
    const fill = document.getElementById('gg-slider-fill');
    
    function sliderJump(clientX) {
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const targetChar = Math.round(ratio * fullText.length);
        let nearest = 0;
        for (let i = 0; i < s.length; i++) {
            if (s[i].start <= targetChar) nearest = i;
            else break;
        }
        const newPct = Math.round((s[nearest].start / fullText.length) * 100);
        thumb.style.left = newPct + '%';
        fill.style.width = newPct + '%';
        return nearest;
    }
    
    let dragging = false;
    let dragTarget = 0;
    
    const onMove = (clientX) => {
        if (!dragging) return;
        dragTarget = sliderJump(clientX);
        const preview = document.getElementById('gg-preview');
        if (preview) preview.textContent = fullText.substring(s[dragTarget].start, s[dragTarget].start + 120) + (s[dragTarget].end - s[dragTarget].start > 120 ? '...' : '');
    };
    
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        thumb.style.cursor = 'grab';
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', onUp);
        jumpToSentence(s, dragTarget);
        openGameGenie();
    };
    
    const mouseMove = (ev) => onMove(ev.clientX);
    const touchMove = (ev) => { ev.preventDefault(); onMove(ev.touches[0].clientX); };
    
    const startDrag = (clientX) => {
        dragging = true;
        thumb.style.cursor = 'grabbing';
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', touchMove, { passive: false });
        document.addEventListener('touchend', onUp);
        onMove(clientX);
    };
    
    thumb.onmousedown = (ev) => { ev.preventDefault(); startDrag(ev.clientX); };
    thumb.ontouchstart = (ev) => { ev.preventDefault(); startDrag(ev.touches[0].clientX); };
    track.onclick = (ev) => {
        const nearest = sliderJump(ev.clientX);
        jumpToSentence(s, nearest);
        openGameGenie();
    };
}

// === LEADERBOARD SYSTEM ===

// ONE read of users/{uid}/profile/info per session, shared by loadInitials()
// and resolveViewMode(). Split out in v3.5.0 because the view mode has to be
// known BEFORE loadUserProgress() — loadChapter() emits textLoaded, and that
// emit needs the right renderer already listening — whereas initials are
// wanted at the end of the chain. Two consumers, still one read.
async function loadProfileInfo() {
    if (!currentUser || currentUser.isAnonymous) { profileInfo = null; return null; }
    try {
        const snap = await getDoc(doc(db, "users", currentUser.uid, "profile", "info"));
        profileInfo = snap.exists() ? snap.data() : {};
    } catch(e) {
        console.warn("Load profile failed:", e);
        profileInfo = {};
    }
    return profileInfo;
}

async function loadInitials() {
    if (!currentUser || currentUser.isAnonymous) return false;
    if (!profileInfo) await loadProfileInfo();
    const data = profileInfo || {};
    if (data.initials) userInitials = data.initials;
    if (data.leaderboardOptOut !== undefined) leaderboardOptOut = data.leaderboardOptOut;
    if (userInitials) return false;
    // No initials yet — prompt
    showInitialsPrompt();
    return true;
}

async function saveInitials(initials) {
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        await setDoc(doc(db, "users", currentUser.uid, "profile", "info"), { 
            initials, 
            leaderboardOptOut 
        }, { merge: true });
    } catch(e) { console.warn("Save initials failed:", e); }
}

function showInitialsPrompt() {
    isModalOpen = true; isInputBlocked = true;
    modalActionCallback = null;
    setModalTitle('');
    resetModalFooter();

    const prefill = getDefaultInitials();

    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">🏆 Enter Your Initials</div>
            <div style="font-size:0.9em; color:#555; margin: 6px 0 12px;">
                These appear on the leaderboard. Three characters max!
            </div>
            <div style="display:flex; justify-content:center; gap:8px;" id="initials-boxes">
                <input class="initials-box" maxlength="1" data-idx="0" value="${prefill[0] || ''}" autocomplete="off" autocapitalize="characters">
                <input class="initials-box" maxlength="1" data-idx="1" value="${prefill[1] || ''}" autocomplete="off" autocapitalize="characters">
                <input class="initials-box" maxlength="1" data-idx="2" autocomplete="off" autocapitalize="characters">
            </div>
            <div id="initials-error" style="color:#D32F2F; font-size:0.8em; margin-top:6px; min-height:1.2em;"></div>
        </div>
    `;

    const btn = document.getElementById('action-btn');
    btn.innerText = 'Save'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    btn.onclick = async () => {
        const boxes = document.querySelectorAll('.initials-box');
        const val = Array.from(boxes).map(b => b.value).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (val.length === 0) return;
        if (!isInitialsClean(val)) {
            const errEl = document.getElementById('initials-error');
            if (errEl) errEl.textContent = "Those initials aren't allowed. Try something else!";
            return;
        }
        userInitials = val.substring(0, 3);
        await saveInitials(userInitials);
        closeModal();

        // After first-time initials, check if furthest point is ahead
        if (isPositionAhead(furthestChapter, furthestCharIndex, currentChapterNum, currentCharIndex)) {
            showJumpToProgressPrompt(furthestChapter, furthestCharIndex);
            return;
        }

        showStartModal("Start");
    };
    showModalPanel();

    // Wire up auto-advance
    setTimeout(() => {
        const boxes = document.querySelectorAll('.initials-box');
        boxes.forEach((box, i) => {
            box.oninput = () => {
                box.value = box.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (box.value && i < 2) boxes[i + 1].focus();
                // Clear error on edit
                const errEl = document.getElementById('initials-error');
                if (errEl) errEl.textContent = '';
            };
            box.onkeydown = (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) {
                    boxes[i - 1].focus();
                    boxes[i - 1].value = '';
                } else if (e.key === 'Enter') {
                    btn.click();
                }
            };
        });
        // Focus the first empty box (after prefill)
        const firstEmpty = Array.from(boxes).findIndex(b => !b.value);
        (firstEmpty >= 0 ? boxes[firstEmpty] : boxes[2]).focus();
        isInputBlocked = false;
    }, 100);
}

// Read the student's own leaderboard doc. Once per session — we are the only
// writer for it, so the in-memory copy stays true. Returns {} if it's new.
async function loadOwnLeaderboardEntry() {
    if (lbOwnEntry) return lbOwnEntry;
    try {
        const lbSnap = await getDoc(doc(db, "leaderboard", currentUser.uid));
        lbOwnEntry = lbSnap.exists() ? lbSnap.data() : {};
    } catch (e) {
        console.warn("Own leaderboard entry read failed:", e);
        lbOwnEntry = {};
    }
    return lbOwnEntry;
}

// Push the in-memory entry to Firestore, including any week-seconds we've been
// holding back. Called on a new PB, on the 2-minute gap, and on tab-hide.
async function flushLeaderboard() {
    if (!lbDirty || !currentUser || currentUser.isAnonymous || !userInitials) return;
    if (!lbOwnEntry) return;
    lbDirty = false;
    const secondsToAdd = lbPendingSeconds;
    const priorSeconds = lbOwnEntry.totalSecondsWeek || 0;
    lbPendingSeconds = 0;
    try {
        lbOwnEntry.totalSecondsWeek = priorSeconds + secondsToAdd;
        lbOwnEntry.lastUpdated = new Date();
        await setDoc(doc(db, "leaderboard", currentUser.uid), lbOwnEntry, { merge: true });
        lbLastWriteTime = Date.now();
    } catch (e) {
        // Roll the entry back AND return the seconds to the pending bucket.
        // Rolling back only one of the two would double-count them on retry.
        console.warn("Leaderboard flush failed:", e);
        lbOwnEntry.totalSecondsWeek = priorSeconds;
        lbPendingSeconds += secondsToAdd;
        lbDirty = true;
    }
}

// Is this student plausibly on the board? Answered from the persisted cutoffs,
// so the common case (no, they're not top-10 in a school of thousands) costs
// nothing. Thresholds only move up, so a stale one makes us miss a celebration
// rather than fake one.
function couldPlace(entry) {
    if (leaderboardOptOut) return false;
    const t = loadLbThresholds();
    // No thresholds recorded yet — we have to look.
    if (!t || Object.keys(t).length === 0) return true;
    return LB_CATEGORIES.some(cat => {
        const mine = entry[cat.key] || 0;
        return mine > 0 && mine >= (t[cat.key] || 0);
    });
}

// Rank the student against the cached top-10 lists. No network.
//
// Ties: a tie at the TOP goes to the student (tie the 100 WPM record, you're
// told #1). A tie at the BOTTOM of a full board does not place, since you
// haven't displaced anyone from the visible ten. The old implementation sorted
// the whole collection and read back an index, so its tie order was whatever
// Firestore happened to return — this is at least deterministic.
function computePlacements(entry) {
    const placements = [];
    if (leaderboardOptOut) return placements;
    for (const cat of LB_CATEGORIES) {
        const mine = entry[cat.key] || 0;
        if (mine <= 0) continue;
        // Drop our own (possibly stale) row before comparing.
        const others = (leaderboardCache[cat.key] || []).filter(e => e.uid !== currentUser.uid);
        // Board full and we don't beat last place? Not on it.
        if (others.length >= 10 && mine <= (others[others.length - 1][cat.key] || 0)) continue;
        const rank = others.filter(e => (e[cat.key] || 0) > mine).length + 1;
        if (rank <= 10) placements.push({ category: cat, rank });
    }
    return placements;
}

async function updateLeaderboard() {
    if (!currentUser || currentUser.isAnonymous || !userInitials) return [];
    try {
        const weekStart = getWeekStart(new Date());
        const existing = await loadOwnLeaderboardEntry();

        // Weekly total resets when the stored weekStart is stale.
        const existingTimeWeek = ((existing.weekStart || '') === weekStart)
            ? (existing.totalSecondsWeek || 0) : 0;
        const weekRolledOver = (existing.weekStart || '') !== weekStart;

        const lastSprintWPM = sprintHistory.length > 0 ? sprintHistory[sprintHistory.length - 1].wpm : 0;
        const lastSprintAcc = sprintHistory.length > 0 ? sprintHistory[sprintHistory.length - 1].acc : 0;

        const newBestWPM     = Math.max(existing.bestWPM || 0, sanitizeSprintWPM(lastSprintWPM, 1));
        const newBestAcc     = Math.max(existing.bestAccuracy || 0, lastSprintAcc);
        const newBestStreak  = Math.max(existing.bestStreak || 0, bestStreak);
        const newChapters    = Math.max(existing.chaptersCompleted || 0, completedChapters.size);

        const gotNewBest =
            newBestWPM    > (existing.bestWPM || 0) ||
            newBestAcc    > (existing.bestAccuracy || 0) ||
            newBestStreak > (existing.bestStreak || 0) ||
            newChapters   > (existing.chaptersCompleted || 0) ||
            existing.initials !== userInitials ||
            existing.leaderboardOptOut !== leaderboardOptOut ||
            weekRolledOver;

        // Update the in-memory entry. NOTE: displayName is deliberately absent.
        // It was written here but never read — the UI shows initials — and this
        // collection is readable by every student. Real names for reporting stay
        // in typing_logs / typing_sessions.
        lbOwnEntry = {
            initials: userInitials,
            leaderboardOptOut: leaderboardOptOut,
            // Tenancy stamps for the queued "My class / My school / Everyone"
            // toggle. Written NOW, ahead of the feature, purely so that the
            // feature doesn't arrive needing a 7,000-document backfill on a
            // collection students can read. Nothing queries these yet. They add
            // no reads and no index requirement until something filters on them.
            // Still initials-only — no name, no email. See the v3.3.0 note.
            classId: ttbClassId || '',
            schoolId: ttbSchoolId || '',
            bestWPM: newBestWPM,
            bestAccuracy: newBestAcc,
            bestStreak: newBestStreak,
            chaptersCompleted: newChapters,
            totalSecondsWeek: existingTimeWeek,
            weekStart: weekStart,
            lastUpdated: existing.lastUpdated || new Date()
        };

        lbPendingSeconds += sprintSeconds;
        lbDirty = true;

        // Write now on a genuine record; otherwise wait out the coalescing gap.
        if (gotNewBest || (Date.now() - lbLastWriteTime) >= LB_WRITE_MIN_GAP_MS) {
            await flushLeaderboard();
        }

        // Placement check. The entry we compare with must include the seconds
        // we're still holding locally, or the weekly board would lag.
        const candidate = { ...lbOwnEntry, totalSecondsWeek: lbOwnEntry.totalSecondsWeek + lbPendingSeconds };

        if (!couldPlace(candidate)) return [];

        // Worth a look. This is FOUR queries at LB_FETCH_LIMIT (15) each, so up
        // to 60 document reads — 90 if the weekly board falls back to the wider
        // unfiltered fetch. The comment here said 40 for several versions and it
        // was never right. Cached for LB_CACHE_MS (10 minutes), and couldPlace()
        // above is what stops the ~99% of students who aren't near a cutoff from
        // ever reaching this line.
        await fetchLeaderboard();
        return computePlacements(candidate);
    } catch(e) { console.warn("Leaderboard update failed:", e); return []; }
}

// Fetch one category's top 10. Firestore does the sorting.
//
// We over-fetch (LB_FETCH_LIMIT) and then filter opt-outs and zeroes on the
// client. That's deliberate: putting where('leaderboardOptOut','==',false) in
// the query would silently drop any document where the field is missing, and
// it would force a composite index on all four categories. Over-fetching a few
// rows costs a few reads and needs no index at all for three of the four.
const LB_FETCH_LIMIT = 15;

const LB_CATEGORIES = [
    { key: 'bestWPM', label: '⚡ Speed', unit: 'WPM' },
    { key: 'bestStreak', label: '🔥 Streak', unit: '' },
    { key: 'chaptersCompleted', label: '📚 Chapters', unit: '' },
    { key: 'totalSecondsWeek', label: '⏱️ Weekly', unit: '', format: 'time' }
];

function lbRowsFromSnap(snap) {
    const rows = [];
    snap.forEach(d => {
        const data = d.data();
        data.uid = d.id;
        rows.push(data);
    });
    return rows;
}

// The weekly board is the one category that needs a server-side filter: a
// student who typed a lot last week still has a big totalSecondsWeek on their
// doc until they type again, so ordering alone would surface stale rows.
//
// where('weekStart','==',x) + orderBy('totalSecondsWeek','desc') needs ONE
// composite index. Firestore logs a console link for it the first time this
// runs. Until it exists the query throws, so we fall back to a wider unfiltered
// fetch — degraded (a quiet week can look sparse) but never broken mid-class.
async function fetchWeeklyRows() {
    const weekStart = getWeekStart(new Date());
    const ref = collection(db, "leaderboard");
    try {
        const snap = await getDocs(query(ref,
            where("weekStart", "==", weekStart),
            orderBy("totalSecondsWeek", "desc"),
            limit(LB_FETCH_LIMIT)));
        return lbRowsFromSnap(snap);
    } catch (e) {
        console.warn(
            "Weekly leaderboard query failed — the composite index " +
            "(weekStart ASC, totalSecondsWeek DESC) is probably missing or still " +
            "building. Check the console error above for a one-click create link. " +
            "Falling back to a client-filtered fetch.", e);
        const snap = await getDocs(query(ref,
            orderBy("totalSecondsWeek", "desc"),
            limit(LB_FETCH_LIMIT * 3)));
        return lbRowsFromSnap(snap).filter(r => (r.weekStart || '') === weekStart);
    }
}

async function fetchLeaderboard() {
    if (Date.now() - leaderboardCacheTime < LB_CACHE_MS && Object.keys(leaderboardCache).length > 0) {
        return leaderboardCache;
    }
    try {
        const ref = collection(db, "leaderboard");
        const result = {};

        for (const cat of LB_CATEGORIES) {
            let rows;
            if (cat.key === 'totalSecondsWeek') {
                rows = await fetchWeeklyRows();
            } else {
                // Single-field descending order — Firestore indexes every field
                // automatically, so no console setup is required here.
                const snap = await getDocs(query(ref,
                    orderBy(cat.key, "desc"),
                    limit(LB_FETCH_LIMIT)));
                rows = lbRowsFromSnap(snap);
            }
            result[cat.key] = rows
                .filter(e => (e[cat.key] || 0) > 0 && !e.leaderboardOptOut)
                .slice(0, 10);
        }

        leaderboardCache = result;
        leaderboardCacheTime = Date.now();
        saveLbThresholds(result);
        return result;
    } catch(e) { console.warn("Fetch leaderboard failed:", e); return {}; }
}

async function openLeaderboard(activeTab) {
    if (isGameActive) { isGameActive = false; clearInterval(timerInterval); }
    isModalOpen = true; isInputBlocked = false;
    modalGeneration++;
    setModalTitle('🏆 Leaderboard');
    resetModalFooter();
    
    document.getElementById('modal-body').innerHTML = `<div style="text-align:center; color:#888; padding:20px;">Loading...</div>`;
    showModalPanel();
    
    const btn = document.getElementById('action-btn');
    btn.innerText = 'Close'; btn.disabled = false; btn.style.opacity = '1'; btn.style.display = 'inline-block';
    btn.onclick = () => { closeModal(); showStartModal("Resume"); };
    modalActionCallback = () => { closeModal(); showStartModal("Resume"); };
    
    const data = await fetchLeaderboard();
    const activeCat = activeTab || LB_CATEGORIES[0].key;
    
    // Build tabs
    const tabs = LB_CATEGORIES.map(cat => {
        const active = cat.key === activeCat ? 'lb-tab-active' : '';
        return `<button class="lb-tab ${active}" data-cat="${cat.key}">${cat.label}</button>`;
    }).join('');
    
    // Build active list
    const entries = data[activeCat] || [];
    let listHTML = '';
    if (entries.length === 0) {
        listHTML = '<div style="color:#999; padding:12px;">No entries yet. Keep typing!</div>';
    } else {
        const cat = LB_CATEGORIES.find(c => c.key === activeCat);
        listHTML = entries.map((entry, i) => {
            const isMe = currentUser && entry.uid === currentUser.uid;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="color:#999; width:1.5em; display:inline-block; text-align:right;">${i + 1}</span>`;
            let val = entry[activeCat] || 0;
            if (cat.format === 'time') val = formatTime(val);
            else val = val + (cat.unit || '');
            const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);
            const adminBtn = isAdmin
                ? ` <button class="lb-admin-reset" data-uid="${escapeHtml(entry.uid)}" title="Admin: reset this entry to 0" style="background:none; border:1px solid #a33; color:#a33; border-radius:3px; font-size:0.7em; padding:0 5px; cursor:pointer; margin-left:6px; vertical-align:middle;">✕</button>`
                : '';
            return `<div class="lb-entry ${isMe ? 'lb-me' : ''}">${medal} <span class="lb-initials">${escapeHtml(entry.initials || '???')}</span> <span class="lb-val">${val}</span>${adminBtn}</div>`;
        }).join('');
    }
    
    document.getElementById('modal-body').innerHTML = `
        <div class="lb-container">
            <div class="lb-tabs">${tabs}</div>
            <div class="lb-list">${listHTML}</div>
        </div>
    `;
    
    // Wire tab clicks
    document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.onclick = () => openLeaderboard(tab.dataset.cat);
    });

    // Admin moderation: reset a single entry's stat for the ACTIVE category.
    // Surgical — zeroes only that field on that user's leaderboard doc; their
    // other categories and all their real progress/stats are untouched.
    document.querySelectorAll('.lb-admin-reset').forEach(btn => {
        btn.onclick = async (ev) => {
            ev.stopPropagation();
            const uid = btn.dataset.uid;
            const catDef = LB_CATEGORIES.find(c => c.key === activeCat);
            if (!confirm(`Reset this player's ${catDef ? catDef.label : activeCat} entry to 0?`)) return;
            try {
                await setDoc(doc(db, "leaderboard", uid), { [activeCat]: 0 }, { merge: true });
                leaderboardCacheTime = 0;   // bust cache
                // A reset lowers the real top-10 cutoff, so the persisted
                // thresholds are now too high and would suppress legitimate
                // placements. Drop them; the re-render below rebuilds them.
                lbThresholds = null;
                try { localStorage.removeItem(LB_THRESHOLD_KEY); } catch (_) {}
                // If the admin reset their own row, our in-memory copy is stale.
                if (currentUser && uid === currentUser.uid) lbOwnEntry = null;
                openLeaderboard(activeCat); // re-render
            } catch (e) {
                alert("Reset failed — Firestore rules may not allow admin writes to other users' leaderboard docs. See console.");
                console.error("Leaderboard admin reset failed:", e);
            }
        };
    });
}

// ========================
// PRACTICE MODE
// ========================

// Test Text constants (used via Game Genie)
const TEST_TEXT_PANGRAM = '"The quick brown fox jumps over the lazy dog!" exclaimed 4 typing teachers.';
const TEST_TEXT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890';

function startTestText(text, label) {
    if (isPracticeMode) return;

    // Save real book state (reuse practice mode machinery)
    practiceRealBookData = bookData;
    practiceRealChapterNum = currentChapterNum;
    practiceRealCharIndex = currentCharIndex;
    practiceRealLastSavedIndex = lastSavedIndex;
    practiceRealFurthestChapter = furthestChapter;
    practiceRealFurthestCharIndex = furthestCharIndex;

    // Enter practice mode with test text
    isPracticeMode = true;
    practiceText = text;
    practiceMissedSnapshot = { ...missedCharsMap };
    bookData = { segments: [{ text: text }] };
    savedCharIndex = 0;
    currentCharIndex = 0;
    lastSavedIndex = 0;
    sprintSeconds = 0;
    sprintMistakes = 0;
    sprintCharStart = 0;

    setupGame();
    getHeaderHTML();

    const bar = document.getElementById('book-info-bar');
    if (bar) bar.classList.add('practice-active');

    closeModal();

    isModalOpen = true; isInputBlocked = false;
    modalActionCallback = startGame;
    setModalTitle('');
    resetModalFooter();
    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center;">
            <div class="stats-title">🔥 Test Text: ${escapeHtml(label)}</div>
            <div style="font-size:0.8em; color:#888; margin:6px 0; font-family:'Courier Prime',monospace;">${escapeHtml(text)}</div>
            <div class="start-hint" style="margin-top:8px;">Type first character to start · ESC to pause</div>
        </div>
    `;
    const startBtn = document.getElementById('action-btn');
    startBtn.innerText = 'Start Typing'; startBtn.onclick = startGame;
    startBtn.disabled = false; startBtn.style.display = 'inline-block'; startBtn.style.opacity = '1';
    showModalPanel();
}

async function startPracticeMode() {
    if (isPracticeMode) return;
    
    // Get the problem characters from the current session
    const entries = Object.entries(missedCharsMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    if (entries.length === 0) return;
    practiceProblemChars = entries.map(([ch]) => ch);
    
    // Get a text snippet for style reference (first 500 chars of current chapter)
    const textSnippet = (fullText || '').substring(0, 500);
    
    // Get book/chapter info
    let chapterTitle = '';
    if (bookMetadata && bookMetadata.chapters) {
        const c = bookMetadata.chapters.find(ch => ch.id === "chapter_" + currentChapterNum);
        if (c && c.title) chapterTitle = c.title;
    }
    const bookTitle = (bookMetadata && bookMetadata.title) || currentBookId.replace(/_/g, ' ');

    // Show loading state
    closeModal();
    isModalOpen = true; isInputBlocked = true;
    setModalTitle('');
    resetModalFooter();
    document.getElementById('modal-body').innerHTML = `
        <div style="text-align:center; padding:20px;">
            <div class="stats-title">✨ Generating Practice...</div>
            <div style="font-size:0.85em; color:#888; margin-top:8px;">
                Creating a paragraph focused on: ${practiceProblemChars.map(c => `<b style="color:#D32F2F;">${escapeHtml(c)}</b>`).join(', ')}
            </div>
            <div style="margin-top:12px; color:#aaa;">This may take a few seconds...</div>
        </div>
    `;
    const btn = document.getElementById('action-btn');
    btn.style.display = 'none';
    showModalPanel();

    try {
        const result = await generatePractice({
            problemChars: practiceProblemChars,
            bookTitle: bookTitle,
            chapterTitle: chapterTitle,
            textSnippet: textSnippet
        });

        practiceText = result.data.text;
        practicePrompt = result.data.prompt || '';
        const remaining = result.data.remaining;
        if (typeof remaining === 'number') practiceRemainingToday = remaining;

        // Save real book state
        practiceRealBookData = bookData;
        practiceRealChapterNum = currentChapterNum;
        practiceRealCharIndex = currentCharIndex;
        practiceRealLastSavedIndex = lastSavedIndex;
        practiceRealFurthestChapter = furthestChapter;
        practiceRealFurthestCharIndex = furthestCharIndex;

        // Enter practice mode
        isPracticeMode = true;
        hasDonePractice = true;
        practiceTypingAccumulator = 0;
        practiceMissedSnapshot = { ...missedCharsMap };
        
        // Inject practice text as a fake chapter
        bookData = { segments: [{ text: practiceText }] };
        savedCharIndex = 0;
        currentCharIndex = 0;
        lastSavedIndex = 0;

        // Reset sprint tracking for practice
        sprintSeconds = 0;
        sprintMistakes = 0;
        sprintCharStart = 0;

        // Set up the display
        setupGame();
        getHeaderHTML();
        
        // Add practice visual indicator
        const bar = document.getElementById('book-info-bar');
        if (bar) bar.classList.add('practice-active');
        
        closeModal();
        
        // Show practice start modal
        isModalOpen = true; isInputBlocked = false;
        modalActionCallback = startGame;
        setModalTitle('');
        resetModalFooter();
        document.getElementById('modal-body').innerHTML = `
            <div style="text-align:center;">
                <div class="stats-title">✨ Practice Ready!</div>
                <div style="font-size:0.85em; color:#888; margin:6px 0;">
                    Focused on: ${practiceProblemChars.map(c => `<b style="color:#D32F2F;">${escapeHtml(c)}</b>`).join(', ')}
                </div>
                ${remaining !== undefined ? `<div style="font-size:0.75em; color:#aaa;">${remaining} practice session${remaining !== 1 ? 's' : ''} remaining today</div>` : ''}
                <div class="start-hint" style="margin-top:8px;">Type first character to start · ESC to pause</div>
            </div>
        `;
        const startBtn = document.getElementById('action-btn');
        startBtn.innerText = 'Start Practice'; startBtn.onclick = startGame;
        startBtn.disabled = false; startBtn.style.display = 'inline-block'; startBtn.style.opacity = '1';
        showModalPanel();

    } catch (e) {
        console.error("Practice generation failed:", e);
        let errorMsg = "The practice writer is busy. Keep typing your book \u2014 " +
                       "it's the same practice, and you can try again in a minute.";
        if (e.code === 'functions/resource-exhausted') {
            // Cache it so getMissedCharsHTML() stops offering the button at all.
            practiceRemainingToday = 0;
            errorMsg = "That's all five practice sessions for today \u2014 nice work. " +
                       "They come back tomorrow. Your book is still right where you left it.";
        } else if (e.code === 'functions/unauthenticated') {
            errorMsg = 'Sign in to use practice mode.';
        }
        
        // Show error then go back to break modal
        document.getElementById('modal-body').innerHTML = `
            <div style="text-align:center; padding:12px;">
                <div class="stats-title">⚠️ Practice Unavailable</div>
                <div style="font-size:0.9em; color:#888; margin-top:8px;">${escapeHtml(errorMsg)}</div>
            </div>
        `;
        const errBtn = document.getElementById('action-btn');
        errBtn.innerText = 'OK'; errBtn.disabled = false; errBtn.style.opacity = '1'; errBtn.style.display = 'inline-block';
        errBtn.onclick = () => { closeModal(); showStartModal("Continue"); };
        modalActionCallback = () => { closeModal(); showStartModal("Continue"); };
    }
}

function exitPracticeMode() {
    if (!isPracticeMode) return;
    
    // Restore real book state
    isPracticeMode = false;
    bookData = practiceRealBookData;
    currentChapterNum = practiceRealChapterNum;
    savedCharIndex = practiceRealCharIndex;
    currentCharIndex = practiceRealCharIndex;
    lastSavedIndex = practiceRealLastSavedIndex;
    furthestChapter = practiceRealFurthestChapter;
    furthestCharIndex = practiceRealFurthestCharIndex;

    // Clear practice state
    practiceRealBookData = null;
    practiceRealChapterNum = null;
    practiceRealCharIndex = null;
    practiceRealLastSavedIndex = null;
    practiceRealFurthestChapter = null;
    practiceRealFurthestCharIndex = null;
    practiceText = '';
    practicePrompt = '';
    practiceProblemChars = [];
    practiceMissedSnapshot = {};

    // Remove practice visual indicator
    const bar = document.getElementById('book-info-bar');
    if (bar) bar.classList.remove('practice-active');

    // Rebuild fullText to check if we were at chapter end
    setupGame();
    getHeaderHTML();
    closeModal();

    // If restored position is at/past chapter end, advance to next chapter
    if (currentCharIndex >= fullText.length) {
        autoStartNext = true;
        advanceToNextChapter();
        return;
    }
}

async function logPracticeSession(wpm, acc, seconds, chars, mistakes) {
    if (!currentUser || currentUser.isAnonymous) return;
    try {
        await addDoc(collection(db, "practice_sessions"), {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            timestamp: new Date(),
            date: getLocalDateStr(),
            // TTL field — practice docs carry the full generated paragraph AND
            // the prompt, so they're the heaviest per-document payload in the
            // database. See firestore.indexes.json fieldOverrides.
            expiresAt: new Date(Date.now() + 120 * 24 * 3600 * 1000),
            // Tenancy stamps. Without these the collection can't be scoped in
            // security rules at all, and its read rule had to be "any staff,
            // anywhere" — a district-wide leak of names and generated text.
            classId: ttbClassId || "",
            schoolId: ttbSchoolId || "",
            bookId: currentBookId,
            chapter: practiceRealChapterNum,
            problemChars: practiceProblemChars,
            prompt: practicePrompt,
            generatedText: practiceText,
            wpm: wpm,
            accuracy: acc,
            seconds: seconds,
            chars: chars,
            mistakes: mistakes,
            // Capture which chars were still problematic during practice
            practiceErrors: Object.entries(missedCharsMap)
                .filter(([ch]) => practiceProblemChars.includes(ch))
                .map(([ch, count]) => ({ char: ch, errors: count }))
        });
    } catch(e) { console.warn("Practice session log failed:", e); }
}

window.onload = init;
