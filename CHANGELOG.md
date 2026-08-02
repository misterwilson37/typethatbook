# CHANGELOG

<!-- CHANGELOG.md v1.0.0 — created 2026-08-02 by Blick. -->

The full per-file history. **File headers carry only the last six entries** — see
the header budget rule in `README.md`. Anything older lives here and nowhere else.

Versions are newest-first within each file. A file's runtime constant is the
authority for what's actually running; this document is the story of how it got
there.

## Contents

- [`game.js`](#gamejs) — currently v3.8.0
- [`adventure-renderer.js`](#adventure-rendererjs) — currently v1.1.0
- [`admin.js`](#adminjs) — currently v3.10.0
- [`learn.js`](#learnjs) — currently v2.1.0

Files not listed here have short headers that fit the budget on their own:
`lessons-admin.js`, `staff-admin.js`, `keyboard.js`, `versions.js`,
`firebase-config.js`, `index.js`, `style.css`, `adventure.css`.

---

## `game.js`

Current: **v3.8.0**

#### v3.5.0

Adventure Mode leaves alpha. Three changes, one feature:

         1. FIRST-RUN SPLASH. A student who has never chosen a view gets a
            full-screen picker with an animated preview of each mode before
            they type a character. Adventure was previously reachable only
            through Settings → View, which most students never opened, so the
            mode with the better engagement numbers was the hidden one.
         2. THE CHOICE FOLLOWS THE STUDENT. viewMode now lives in
            users/{uid}/profile/info alongside initials, and is read as part
            of the SAME getDoc() that already loads initials — no extra reads.
            localStorage stays as the pre-auth fast path so the correct view
            paints before Firestore answers, and is reconciled after.
         3. HOT SWAP, NO RELOAD. applyViewMode() mounts/unmounts the renderer
            and replays textLoaded + positionSet into it. The old settings
            toggle called location.reload(), which was acceptable for a
            deliberate settings change but not for "you sat down at a
            different Chromebook and we noticed".
         Also: document.title driven from VERSION (open work §9 item 5);
         "(alpha)" removed from the Settings label.

#### v3.8.0

Tier 3. Two things, both small:

         STUDENT SCHOOL PICKER (§9 item 4). Until now a student's building was
         set only by staff, so a student nobody had added yet typed with
         schoolId:'' and was invisible to every building-scoped report — and
         there was no way for them to say where they were. Settings now has a
         School control. Never forced; "No school" stays a valid permanent
         state, which is the point (Jake's son isn't in a building).
         ⚠️ It is READ-ONLY once a teacher has put them in a class. A student
         must not be able to overrule their teacher, and making the teacher's
         assignment win means the picker self-corrects the moment one happens.
         PRACTICE GATING now tells the truth (§A.10). The cooldown counter
         only advances while you TYPE, which the old wording never said, and
         it rounded 5 seconds up to "~1m". The daily cap is also checked
         before the button is offered rather than after a failed round-trip.

#### v3.7.0

Chapter picker survives a 286-chapter book. A <select> with 286

         options and no search means finding "The Donkey and the Lapdog"
         is a scroll, not a lookup. Above CHAPTER_FILTER_MIN the picker gains
         a filter box matching chapter number or title, with Enter as Go.
         Also collapses THREE divergent copies of the chapter-option builder
         into buildChapterOptions(). They had already drifted — the settings
         list showed "✓ Ch. 4: Title" while the post-book-switch rebuild of
         the SAME dropdown showed "Chapter 4: Title" with no completion
         ticks, so switching books silently changed the labels.

#### v3.6.0

Book progress bar survives a 286-chapter book. Aesop's Fables was the

         first book to exceed ~40 chapters and it broke the bar two ways:
         VISUALLY, each chapter got 1/286th of a ~280px strip — under one pixel,
         with a 1px divider inside it, so the whole bar rendered as a grey
         hairline smear (confirmed by screenshot).
         And far worse, PER KEYSTROKE: the bar built 5 DOM nodes per chapter
         (~1,430 for Aesop) and updateProgressBars() then did FOUR
         getElementById calls per chapter on every character typed — 1,144 DOM
         lookups per keystroke, on Chromebooks. That is a typing-latency bug
         wearing a cosmetic bug's clothing.
         Above BOOK_BAR_MAX_SEGMENTS the bar now renders condensed: one track,
         one fill, one marker, three nodes total and three lookups per
         keystroke regardless of chapter count. The label carries the
         information the segments used to ("Ch 12 / 286").

#### v3.4.2

practice_sessions now also carries classId/schoolId. Without them the

         collection was unscopeable in security rules, so its read rule had to
         be "any staff member, any district" — and those documents contain
         email, displayName, and the full generated paragraph.

#### v3.4.1

practice_sessions now writes an expiresAt TTL field. It was the one

         append-only collection still growing without bound; typing_sessions
         got one in v3.4.0 and this was missed. TTL policies for both are in
         firestore.indexes.json fieldOverrides.

#### v3.4.0

Write reduction. saveProgress() used to fire on every '.', '!', '?'

         and newline, writing THREE documents each time (~236,000 writes/day
         at 7,000 students against a 20,000/day free tier).
         Replaced with a localStorage write-ahead log plus a coalesced flush:
           - every sentence still records EVERYTHING, synchronously, locally
           - Firestore gets a batched flush every 5 min and on session end
           - walRecover() replays unflushed work on next load
         This is MORE durable than what it replaced, not less. The old code
         lost everything since the last punctuation mark if the tab died; the
         WAL loses nothing. Student position, time, speed and accuracy are all
         still tracked and still resume exactly where they left off.
         Also:
           - progress + completedChapters merged into one document (was two
             writes to the same doc)
           - typing_sessions: one rollup doc per session with a sprints[]
             array instead of one doc per sprint, plus an expiresAt TTL field
           - chapter text cached in localStorage (biggest per-load read)
           - goals/class/school cached for a day (was 2-3 reads every load)
           - chapter advance does one write instead of two
           - classId/schoolId stamped on typing_logs and typing_sessions so
             reports can be scoped by class or building. See MULTITENANCY.md.

#### v3.3.0

Leaderboard scale rework. The old fetchLeaderboard() read EVERY

         document in the leaderboard collection to build four top-10 lists,
         and updateLeaderboard() busted its own cache before calling it on
         every sprint end. At 7,000 students that projected to ~327M reads
         and ~82GB egress per day. Now:
           - four indexed orderBy+limit(10) queries: 40 reads, not 7,001
           - cache is 10 minutes and is NOT busted on the hot path
           - placements computed locally against cached threshold values,
             so a normal sprint costs zero reads
         - own leaderboard doc read once per session, not once per sprint
         - writes coalesced to >=120s apart (or immediately on a new PB),
           flushed on visibilitychange:hidden
         - displayName no longer stored on leaderboard docs. It was written
           but never read; the UI shows initials. Real names for the admin
           panel still live in typing_logs / typing_sessions, untouched.
         Needs ONE composite index (weekly board). Falls back gracefully
         while it builds — see fetchLeaderboard().

#### v3.2.0

Per-mistake corrections: mistakes at the current letter accumulate

         (deepening red shade in classic view) and each backspace undoes
         exactly one — the cursor doesn't move back until all mistakes at
         the letter are undone, just like deleting real typed characters.
         New ttb:backspaceUndo event drives the adventure tilt-back.

#### v3.1.1

textLoaded emit carries chapters + completedChapters for the

         adventure chapter map (null chapters in practice mode)

#### v3.1.0

Leaderboard hardening: WPM sanity clamp (impossible speeds were being

         recorded), admin per-entry reset buttons, Accuracy category removed;
         400ms grace period on chapter-complete any-key advance; stale
         sprint/hard-stop state cleared on every chapter load; dead
         practice-restore variable removed

#### v3.0.7

Game Genie warps emit positionSet (adventure canvas was desyncing);

         hard-stop modal escapes the resume key before innerHTML injection

#### v3.0.6

Daily timer renders correctly on page load (was stuck at 00:00 until first keystroke)

#### v3.0.5

Chapter-end modal accepts Enter/Space; Day timer shows secondsToday;

         drop redundant colon between timer label and value

#### v3.0.4

Sentence-rollback on hard-stop only fires in adventure mode

#### v3.0.3

Hard-stop modal asks for sentence-start letter; spam threshold = 3

#### v3.0.2

Hard-stop rolls cursor back to start of current sentence

#### v3.0.1

Adventure Mode integration; cross-file version banner

---

## `adventure-renderer.js`

Current: **v1.1.0**

adventure-renderer.js — v1.1.0

#### v1.1.0

Chapter map survives a 284-chapter book.

  Aesop's Fables put 284 dots at 4.2px radius down a ~500px strip — roughly
  1.8px of room each — so the map rendered as a solid brown caterpillar
  (confirmed by screenshot). Above MAP_MAX_DOTS the map now draws the route
  as a continuous inked line with sparse tick marks and only three dots that
  matter: start, finish, and where you are. The journey still reads; the
  clutter doesn't. Small books are untouched.

#### v1.0.0

OUT OF ALPHA. Adventure Mode is now offered to every student on a

  first-run splash (game.js >= 3.5.0) rather than hiding behind Settings →
  View, so the version number stops saying "prototype". No rendering changes.
  One behaviour change:
  - DIAGNOSTIC OVERLAY now needs Ctrl+Shift+` or Cmd+Shift+` instead of a
    bare backtick. Backtick is a real key in the virtual keyboard's numRow
    for both QWERTY and Dvorak, so any student could open the overlay by
    typing it — harmless (it's read-only, typing continues normally) but it
    covers part of the canvas and looks like a crash to a sixth grader.
    The modifier keeps it a one-keystroke teacher tool.

#### v0.4.0

Tilt-back corrections + chapter close-up strip:

  - TILT-BACK: each backspace at the current letter undoes exactly one
    mistake's worth of tilt (driven by the new ttb:backspaceUndo event
    from game.js >= 3.2.0) and marks the letter recovered (blue). Two
    mistakes need two backspaces to fully straighten — like deleting
    real typed characters. Tilts are now count-based (angle = kick ×
    mistakes remaining) instead of additive, and a fresh mistake on a
    recovered letter un-blues it.
  - CLOSE-UP: a left-edge strip mirrors classic view's chapter progress
    bar in map style — the current chapter as a vertical route, tiny
    pilcrow ticks at paragraph starts (inked once passed), a pulsing
    gold marker at the current position, and the route inking downward
    as you type. Right-edge book map dots and line slightly enlarged
    for legibility.

#### v0.3.0

Chapter map + pilcrow landing marks (minor bump: new feature):

  - CHAPTER MAP: an always-visible strip on the right edge of the canvas,
    Indiana-Jones style. Chapters are dots top-to-bottom; a wobbly
    hand-drawn red route line fills in as you type — the segment leading
    into the current chapter's dot creeps forward with currentPos, and
    completes with a gold burst on chapter finish (visible beside the
    stats modal). Completed dots are filled rubric red, the current dot
    glows with a pulsing ring and a "Ch N" label, upcoming dots are
    faded hollow rings. Requires game.js >= 3.1.1 (chapters +
    completedChapters in the textLoaded emit); hides itself otherwise.
  - PILCROW: every paragraph's leading tab gap now shows a faded rubric
    ¶ at letter height — the medieval manuscript paragraph mark, in the
    traditional red. The figure's big leap lands ON the pilcrow, then
    mini-hops onto the first word. Answers "what is he standing on?"
    with something period-correct.

#### v0.2.16

Indent mini-leap (no more tab teleport):

  - Typing across a wide within-paragraph gap (the tab indent) now
    triggers a short, low leap (250ms, small arc) using the same
    interpolation machinery as paragraph leaps. Before this, the figure's
    X snapped across the indent in one frame while the camera lerped to
    catch up — visible as a forward teleport right after the big jump.
  - Jump duration is now a field (jumpDurationMs) instead of a hardcoded
    600 in the loop, so big leaps and mini-leaps share one code path.
  - Chaining works both directions: a mini-leap triggered mid-big-leap
    (or vice versa) starts from the figure's current interpolated
    position, same as the v0.2.15 retrigger rule.

#### v0.2.15

Leap state hygiene (found in code review):

  - isJumping and leap anchors are now cancelled on fail, respawn,
    textLoaded, and positionSet. Before this, dying / respawning /
    switching chapters / Game-Genie-warping mid-leap left the loop
    driving cameraX/cameraY from stale leap interpolation for up to
    600ms, stomping the respawn/warp camera placement.
  - Mid-leap paragraph retrigger (consecutive short paragraphs, e.g.
    dialogue) now starts the new leap from the figure's CURRENT
    interpolated position instead of snapping back to the previous
    paragraph's end. _leapStartCameraY is also re-anchored on every
    trigger instead of keeping the first leap's stale value.

#### v0.2.14

Figure leap is no longer a teleport:

  - During a leap, the figure's coord X is interpolated from the OLD
    position (the period at the end of the previous paragraph) to the new
    position (the J at the start of the new paragraph) using the same
    smoothstep curve as the Y motion. CameraX is set directly off this
    interpolated value (no lerp during leap), keeping the figure perfectly
    anchored at 35% screen-X for the duration of the arc. Result: figure
    stays put visually while the world slides under it — the new
    paragraph "comes to meet" the figure as Jake described.
  - Before this, currentPos jumped to the new paragraph's start in one
    keystroke, which meant the figure rendered ~80px to the right of
    anchor for one frame, then lerped back over ~14 frames. Visible as
    a single-frame teleport in slow-motion video capture.

#### v0.2.13

Defensive transform reset + better diagnostics.

#### v0.2.8

Persistent tilts + (broken) backspace recovery via positionSet.

#### v0.2.7

Underscore-style cursor gap + keyboard skin shim:

  - Cursor-gap red bridge line drops to LETTER BASELINE (like an underscore).
    Space label below the line; tab/enter labels above.
  - Keyboard re-tinted to muted vintage finger colors via MutationObserver
    shim. keyboard.js untouched; classic view bit-for-bit unchanged.
  - Death cleans falling-letter and tilt state so the respawn sentence
    displays cleanly. (Already mostly working in v0.2.5; locking it down.)

#### v0.2.6

Letters become walkable surface, gaps render only at cursor.

#### v0.2.5

Connector line in gap only, letter tilt on stumble, letters fall

  on plummet, head-rolling ghost, leap arc clears next paragraph.

#### v0.2.4

Diagnostic overlay + stumble/plummet split + curly-quote flip +

  platform line below words.

#### v0.2.3

Integration of Gemini's refined animation block (gait, hop, leap,

  stumble, respawn, three ghost styles). X-eyes only on actual ghosts.

v0.2.2 bugfixes:
  - Respawn detritus: paragraph crossings now rebuild via
    _relayoutCurrentWorld instead of appending forever.
  - Preview paragraph fades to ~30% alpha and loses its platform underline.
  - Tabs render distinctly: wider gap, italic "tab" label.
  - Gravestone inscription: each grave displays the failed letter.
  - Space pit drops below the platform line so the figure visibly hops.

v0.2.1 bugfixes:
  - Per-letter rendering with active-cursor highlight.
  - Bigger text (32px).
  - "space" italic label restored.
  - Curly-quote fix: ctx.fontKerning = 'none'.

Observer of TTB events. Listens to ttb:* CustomEvents on document and renders
the typing experience as a stick figure walking across word-platforms with
a parchment aesthetic. Owns no game logic. Reads no game state directly.
All it knows is what game.js tells it via events.

Mounted by game.js when the user has selected Adventure view. Unmounted
(canvas hidden, listeners removed) when they switch back to Classic.

Events consumed:
  ttb:textLoaded   { fullText, chapterTitle }       — new chapter ready
  ttb:textCleared  {}                                — chapter unloading
  ttb:positionSet  { position, isResume }            — cursor jumped (resume, fail, etc)
  ttb:keystroke    { char, correct, position, expected, status }
  ttb:fail         { reason, position }              — hard stop / spam / afk
  ttb:respawn      { position }                      — resume after pause
  ttb:stats        { wpm, accuracy, ... }            — periodic stats update
  ttb:complete     {}                                — chapter finished

Event source: document.addEventListener('ttb:keystroke', ...). The renderer
never reads from window.* / DOM ids it doesn't own / globals.

Design rules:
  - Canvas-only DOM mutation. The renderer never touches #text-stream,
    #virtual-keyboard, the modal, or any classic-view element.
  - Idempotent mount/unmount. Calling mount twice is safe; unmount removes
    all listeners.
  - Survives missed events. If textLoaded was missed, the renderer just
    shows nothing until the next one arrives.

---

## `admin.js`

Current: **v3.10.0**

admin.js v3.10.0

#### v3.10.0

ONE PASS PER BOOK. Two divergent copies of "write the book document"

         had drifted apart, so every book had to be visited twice and you had
         to know which button wrote which field.

         ROOT CAUSE of "Save Metadata loses the chapters": saveTitleBtn called
         loadBookList() to refresh the picker (added v3.6.0, well meant), and
         loadBookList ended with `selectedIndex = 1` + a synthetic change
         event. bookSelect.onchange hides the staging area AND reassigns
         activeBookId — to the FIRST book alphabetically, not the one being
         edited. So it didn't merely hide the chapters, it silently repointed
         the editor at a different book. loadBookList() now preserves the
         selection and takes an explicit flag before it fires onchange.

         Upload All was missing minAge/maxAge/protagonistGender entirely (my
         miss in 3.7.0 — I added them to Save Metadata only), read genre via
         .value instead of readGenreField() so "Custom..." stored the literal
         "__custom__", and still had the `if (author)` guards that v3.6.0
         removed from the other path. That genre read is the FOURTH instance
         of the read-the-field-properly bug HANDOFF §11 warned to look for.

         Both paths now share readBookMetadataForm(). One reader, one writer,
         no drift. Upload All writes chapters AND metadata, so a new book is
         finished in one pass.

         Also: find & replace across a staged book, with case preservation and
         automatic a/an correction. Built after doing 169 of them by hand in
         Aesop's Fables.
v3.9.0

#### v3.9.0

EPUB import: split multi-work spine files.

         The importer assumed one spine file == one chapter. Standard Ebooks
         (where most of this library comes from) puts every short work of a
         COLLECTION in a single XHTML file as sibling <article>/<section>
         elements — Aesop's Fables is 284 fables in one file. That imported as
         one 238KB "chapter" with 284 titles run together, and the alternative
         was splitting and naming 284 chapters by hand.
         findChapterUnits() now detects that shape and splits on it. Novels are
         unaffected: one heading per file means no split, and the old path runs.
         Also fixes a latent bug — title extraction used hTag.innerText, which
         is undefined on a DOMParser document in Firefox because innerText
         needs layout. Every imported title would have been blank there.
         Also: the seven period words previously held back are now flagged, at
         Jake's request. See the note above FLAGGED_WORD_GROUPS.review.
v3.8.0

#### v3.8.0

Language filter: regex + audit. The persistent "always flag these"

         list now accepts /…/ patterns like the free-text search already did,
         patterns are validated on entry AND defensively at scan time (one bad
         stored pattern used to be able to break every scan), and there is
         finally a way to SEE the effective list — built-in plus custom, with
         a live tester. FLAGGED_WORDS regrouped by category and substantially
         expanded for period literature; see the note above it.
         Also: book list CSV export + an on-page balance report, for checking
         the library's spread of genre / age / protagonist.
v3.7.0

#### v3.7.0

Book tags: target age range (minAge/maxAge) and protagonistGender on

         books/{id}. Written unconditionally by Save Metadata, same as author
         and genre — see the v3.6.0 note on `if (author)` silently keeping the
         old value when a field is blanked. Age is validated as a RANGE, not
         two independent numbers: half a range is a data bug, and min > max is
         silently unmatchable by the library's overlap test.
         The book picker now marks untagged books with a bullet so the tagging
         backlog is visible while working through it.
v3.6.0

---

## `learn.js`

Current: **v2.1.0**

learn.js — TypeThatBook School v2.1.0

#### v2.1.0

Batch B: run-level instrumentation. lessonProgress was written from one

         place (the final run's modal, grade != F), so a student stuck on run 2 of
         12 wrote nothing at all and showed in admin as "not started" — the exact
         failure the audit was about was the one the data couldn't show. Now every
         finished run records runAttempts/runFailures/furthestRunIdx/lastSeenAt.
         Writes are queued onto the existing coalesced flush rather than fired per
         run, so this costs no extra Firestore writes or reads. Also fixes
         timeSpentSeconds, which counted only the final run, and adds merge:true to
         saveProgress, which was replacing the whole document.

#### v2.0.0

MAJOR (signed off by Jake 2026-08-01). Lesson mechanics rebuilt after an

         audit found students stalling mid-curriculum and blaming their own typing.
         Full analysis in PEDAGOGY-AUDIT.md. Seven changes:
           1. STEPS ARE CHUNKED INTO RUNS. Six authored steps were longer than a
              10-minute class period at the pace needed to pass them (u6_l2 step 1:
              789 chars at a 20 WPM gate = 10.5 min of flawless typing). Chunking
              happens in the engine, so all 47 lessons are fixed with no data change.
           2. RUN POSITION IS PERSISTED (ttb_learnpos_v1). The old WAL saved stats
              only, so the bell erased the whole run — making any run longer than
              the time left in the period permanently unfinishable.
           3. KEY DRILLS ARE GRADED ON ACCURACY ONLY. Speed on random letter groups
              is not a meaningful measure, and gating it made the new-key drill the
              hardest thing in its own lesson.
           4. WPM IS NET. chars++ ran before the correct/incorrect branch, so errors
              inflated reported speed — three deliberate mistakes could turn a
              failing 14 WPM perfect run into a passing 15 WPM one.
           5. THE GRADED CLOCK PAUSES ON IDLE. It previously ran regardless, so an
              interruption could put the gate out of reach and the app would then
              tell the student to type faster.
           6. C ADVANCES, AND A FAILED RUN RETRIES THAT RUN. Missing the gate on the
              last step used to replay the entire lesson including the intro.
           7. A🔥 IS REACHABLE — a clean run on drills, 1.5× (not 2×) on prose.
         Removed: DRILL_STOP_TIME_THRESHOLD, which did not do what it claimed.
NOTE: the authoritative version is LEARN_VERSION below, not this comment. An
      earlier header claimed v1.0.0 while the constant read 1.6.3; the
      constant was right. This file's real lineage is 1.6.x → 1.7.0.

#### v1.7.1

applyPendingClassAssignment now stamps schoolId alongside classId.

         Without it a student had a class but no building, which made them
         invisible to their own teacher under the new security rules.

#### v1.7.0

Write reduction to match game.js v3.4.0. saveStats() fired on every

         completed lesson step and wrote two documents each time (~20-40
         writes per student per block). Now backed by a localStorage
         write-ahead log with a coalesced flush every 5 min and on session
         end; walRecoverLearn() replays anything unflushed on next load, so
         this is more durable than the old fire-and-forget beforeunload path.
         Also stamps classId/schoolId onto typing_logs for scoped reporting,
         and adds a visibilitychange handler (beforeunload is unreliable on
         Chromebooks).

---
