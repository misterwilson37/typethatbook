# CHANGELOG

<!-- CHANGELOG.md v1.1.0 — created 2026-08-02 by Blick.
     v1.1.0 — Round 4 (Oliver): the cost/grades/stability audit pass. -->

The full per-file history. **File headers carry only the last six entries** — see
the header budget rule in `README.md`. Anything older lives here and nowhere else.

Versions are newest-first within each file. A file's runtime constant is the
authority for what's actually running; this document is the story of how it got
there.

## Contents

- [`game.js`](#gamejs) — currently v3.9.2
- [`adventure-renderer.js`](#adventure-rendererjs) — currently v1.1.0
- [`admin.js`](#adminjs) — currently v3.18.3
- [`index.js`](#indexjs-cloud-functions) — currently v1.6.0
- [`learn.js`](#learnjs) — currently v2.2.1

Files not listed here have short headers that fit the budget on their own:
`lessons-admin.js`, `staff-admin.js`, `keyboard.js`, `versions.js`,
`firebase-config.js`, `index.js`, `style.css`, `adventure.css`.

---

## `game.js`

Current: **v3.9.2**

#### v3.9.2

Round 5 (Mignon). Two defects in v3.9.0/v3.9.1's own audit work, both found
before either shipped. Neither file had been uploaded, so nothing in production
was ever affected.

         1. THE RE-ENTRANCY GUARD WAS `if`, NOT `while`. v3.9.0 added a guard
            to flushAll() to stop overlapping runs writing a duplicate
            typing_sessions rollup. It serialises TWO callers correctly and
            fails at three or more: when the running flush resolves, its
            `finally` nulls the slot, and every caller parked on that promise
            is already past the `if` — so they all claim the slot and their
            inner runs execute concurrently. Measured by lifting the shipping
            function into a harness: 6 simultaneous callers produced 5
            overlapping runs. `while` fixes it because the re-check after the
            await is synchronous with the assignment that follows, so the
            caller that leaves the loop claims the slot before any other
            caller can re-check. Four call sites (interval timer,
            visibilitychange, saveProgress(force), walRecover()) make
            three-deep reachable in ordinary use.
         2. THE SPRINT ROLLUP IS CHUNKED AT 200 SPRINTS PER DOCUMENT.
            firestore.rules v2.2.0 newly requires `sprints.size() <= 200` and
            `seconds <= 86400` on typing_sessions. Nothing on the client
            enforced either, and pendingSessions has no cap — walRecover()
            CONCATENATES a recovered log onto the live one. So one failed
            rollup could push the array past the ceiling, after which every
            write is denied, denial keeps the WAL, and the kept WAL is
            re-concatenated next session: a permanent, silent, self-feeding
            failure. Chunks advance out of pendingSessions one at a time and
            only after their write lands, so a mid-run failure keeps exactly
            the sprints not yet stored — verified for loss, duplication and
            cap compliance across eight scenarios including denial on the
            first and second chunk. `seconds` is also clamped as a backstop,
            with a console warning if it ever fires.
         ⚠️ SHIP THIS WITH firestore.rules v2.2.0. Rules 2.2.0 without this
         file introduces the poison pill described above; this file without
         rules 2.2.0 is harmless.

#### v3.9.1

         CHAPTER_CACHE_MS back to 7 days. v3.9.0 cut it to 12 hours because
         `contentVersion` — the field this cache invalidates on — was read here
         and written nowhere, making the expiry the only invalidation the cache
         had. admin.js 3.12.0 writes it, so seven days is now a ceiling for an
         unedited book rather than a floor on how long a correction takes.
         ⚠️ These two files are a pair. Rolling admin.js below 3.12.0
         reintroduces week-long stale chapters with no other symptom.

#### v3.9.0

Round 4 audit pass. Five changes, no new features.

         1. flushAll() RE-ENTRANCY GUARD. It was reachable from four places
            (interval timer, visibilitychange, saveProgress(force),
            walRecover()) and is async with four sequential awaits. Two
            overlapping runs both captured the same sessionsBeingWritten
            slice, both addDoc()'d it, and both then advanced the queue past
            it. The result was a DUPLICATE typing_sessions document, which
            double-counted minutes in the per-day sprint drill-down a teacher
            opens to check a student's work. typing_logs was unaffected — it
            is a merge, so it was always idempotent.
         2. HIDDEN-TAB FLUSH DEBOUNCED to once a minute. visibilitychange
            fires on every tab switch, not at session end, and each one was a
            full final flush: up to four Firestore writes plus a leaderboard
            write. The localStorage WAL write is free and still fires every
            time, which is the part that actually protects the work.
         3. PER-KEYSTROKE DOM WORK. highlightCurrentChar() ran
            document.querySelectorAll('.letter.active') — a full-document scan
            over ~8,000 spans — on every character, to find nothing, because
            handleTyping() had already cleared the class three lines earlier.
            It now tracks the element. centerView() read clientHeight and
            offsetTop right after a class mutation (forced synchronous layout,
            per character) and is now batched into one requestAnimationFrame
            with the container height cached until resize.
         4. CHAPTER CACHE TTL 7 days -> 12 hours. Not a tuning change: the
            comment claiming admin.html bumps `contentVersion` was false, so
            the expiry was the only invalidation this cache has ever had.
            Reverts to 7 days once admin.js actually writes the field.
         5. Leaderboard entries now carry classId / schoolId, written ahead of
            the queued scope toggle so it will not need a 7,000-document
            backfill. Nothing queries them yet. Still initials-only.

         Also: the comment claiming fetchLeaderboard() costs 40 reads was
         corrected to 60 (four categories at LB_FETCH_LIMIT 15), or 90 on the
         weekly fallback path.

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

Current: **v3.18.3**

⚠️ **Versioning note.** v3.12.0 through v3.18.0 were bumped as MINOR versions and
most of them were straight bug fixes that should have been PATCH. Jake caught it:
"We haven't added any features in a couple of turns — just tweaked what's already
there." He's right, and six inflated versions in a row makes the number stop
carrying information. Corrected going forward: a bug fix is x.y.**Z**; a minor
bump means a new capability actually arrived. Past numbers are left alone because
some of those files are already deployed and rewriting history would make the
CHANGELOG disagree with what is running.

By that standard: v3.17.0 (sort staged chapters) and v3.18.0 (re-entrancy guard)
should have been v3.16.1 and v3.16.2.

⚠️ And then the very next release broke the rule again. It shipped as v3.19.0 on
the grounds that "Start another book" was a new control — but the whole release
was fixing "there is no way to clear the create form," and a second path to a
reset that was supposed to work is a fix, not a feature. Jake caught that too,
one turn after catching the first one. Renumbered to **v3.18.1**. Recorded here
rather than quietly corrected, because stating a standard and then exempting
yourself from it in the same message is the more instructive failure.

#### v3.18.3

Round 5 (Mignon). **The EPUB cover bug**, plus four defects found on the same
path while proving it.

         THE BUG. JSZip's `.async("blob")` builds its Blob with an EMPTY type —
         `""`, hardcoded, jszip/lib/zipObject.js:65. Firebase's uploadBytes()
         then falls through `metadata.contentType || blob.type ||
         'application/octet-stream'` and stored every EPUB-extracted cover as
         application/octet-stream. storage.rules v2.0.0 required
         `contentType.matches('image/.*')`, which that never satisfies — so every
         cover from an EPUB was denied with storage/unauthorized while every
         cover chosen by hand sailed through, because the file picker hands over
         a File carrying a real image/jpeg. That single difference is why this
         presented as an EPUB problem rather than a permissions one. It had been
         diagnosed once as an AVIF mapping issue, which was the wrong half: the
         format is irrelevant, the type is gone before anyone looks at it.
         Confirmed against Jake's Northanger Abbey failure and his report that
         manual uploads worked — those two facts identify the failing clause by
         elimination, since nothing about identity can tell the paths apart.

         Fixed at the source: sniffImageType() reads magic bytes (JPEG, PNG,
         GIF, WEBP, BMP, AVIF, HEIC, and SVG by tag), the Blob is rebuilt
         carrying that type so the preview is honest too, and the type is passed
         explicitly to uploadBytes. uploadCover() now REFUSES a blob with no
         image type rather than uploading something that stores as octet-stream
         and fails to render for reasons nobody connects back to it.

         1. DETECTION DID NOT CHECK THE MEDIA TYPE. Methods 1 and 2 accepted
            whatever the manifest pointed at. Standard Ebooks points
            `properties="cover-image"` at `images/cover.svg` — a WRAPPER whose
            only content is an <image> referencing the real raster. An SVG in an
            <img> tag runs in secure static mode and cannot load external
            resources, so that wrapper is a permanently blank cover. All three
            methods are type-checked now, and when the chosen cover is an SVG the
            raster inside it is read out of the wrapper and preferred; failing
            that, a cover-ish raster sibling; failing that the SVG is kept and
            flagged as probably blank.
         2. PERCENT-ENCODED HREFS WERE NEVER DECODED. `decodeURIComponent`
            appeared nowhere in the file, so `images/cover%20art.jpg` never
            matched the zip entry `images/cover art.jpg`. New zipEntry() helper
            tries the raw name first (a zip entry may legally contain a literal
            %) then the decoded one, and is used for cover, spine and nav.
         3. A MISSING SPINE FILE KILLED THE WHOLE IMPORT ANONYMOUSLY. It was
            `zip.file(p).async(...)`, which throws on null with a TypeError
            naming nothing. Now the file is named on screen, counted, and costs
            one chapter instead of the book — partial-and-labelled beats nothing.
         4. THE PARSE SUMMARY NEVER MENTIONED THE COVER. It reported chapters,
            splits, paragraph reconciliation and language warnings and was silent
            about the cover in both directions, so a silent extraction failure
            looked exactly like success. The one message it did write was
            overwritten unconditionally. The cover is now named in every outcome,
            with its content type, and both save paths name it on success too —
            §B.9's rule finally applied to the parse.
         5. parseEpubFile() HAD NO RE-ENTRANCY GUARD, despite §B.9 stating the
            rule that would have caught it. It opens with `stagedChapters = []`,
            is reachable from two file inputs, and nulls stagedCoverBlob several
            awaits in. Dropped rather than queued — the opposite of flushAll(),
            because a second parse of a file picker is a double-click with no
            work worth keeping. Released in a finally.
         6. THE INLINE SAVE MESSAGE COULD NOT GO AWAY. `save-title-status` was
            written in one place and cleared in none, so a green "✓ Saved ·
            genre: Horror · cover saved" from one book sat beside the NEXT book's
            form while the top of the page showed that book's COVER FAILED. The
            message was accurate about the book it was written for — which is
            §B.9 in mirror image, a success reported about the wrong SUBJECT
            rather than a failure in the wrong PLACE, and it cost real trust in a
            message that was telling the truth. Cleared on book change, Open
            Book, EPUB parse and Upload All.

         Verified by a rebuilt §B.7-style harness (cover-harness.mjs) that lifts
         sniffImageType(), zipEntry() and resolvePath() out of this file by
         brace-matching and replays them against ten synthetic EPUBs modelled on
         the real structures: SE with an SVG wrapper over AVIF, SE with a dangling
         wrapper reference, a wrapper with no raster at all, Gutenberg with a
         percent-encoded href, EPUB 2 <meta name="cover">, a meta pointing at the
         cover PAGE, a manifest that lies about the format, a declared cover
         absent from the zip, non-image bytes, and no cover at all. Every case
         resolves to the right file with the right type, and every warning fires
         exactly when it should.

#### v3.18.2

⚠️ **This entry was reconstructed in Round 5.** v3.18.2 shipped, is the version in
the repo, and is documented in the file header — but it was never added here, so
the CHANGELOG jumped from v3.18.1 straight to v3.18.3 and this file's own
"currently vX" line still said v3.18.1. Recorded from the header rather than left
as a hole.

         A failed cover upload is no longer invisible. uploadCover() reported its
         errors to the status bar at the TOP of the page — roughly seventy lines of
         markup above the button that triggered it, and reliably scrolled out of
         view — while the inline message beside Save Metadata said "✓ Saved",
         because the Firestore write DID succeed and only the cover did not. So a
         failed cover looked exactly like a successful save, and two books went up
         with no cover before anyone noticed. Save Metadata now refuses to write at
         all if the cover fails, uploadCover() returns a result rather than a
         URL-or-null so callers cannot swallow the error, and both paths name
         Firebase STORAGE rules specifically — which are separate from
         firestore.rules and had never existed anywhere in this repo.

         ⚠️ This fix is what made Round 5's diagnosis possible: it is the error
         message in Jake's Northanger Abbey screenshot. The defect it fixed was
         real, but it was the REPORTING of the cover failure, not the cause — see
         v3.18.3.

#### v3.18.1

         Two ways back to an empty create form, because there were none. Also
         paired with admin.html — the EPUB picker now sits ABOVE the three
         fields it auto-fills, since asking for them first was asking a
         question the next control answers.

         1. "Start another book" clears the form AND the staging state. Not
            just the visible inputs: stagedChapters, stagedFromDB, activeBookId,
            the cover blob, the audit panels. A blank form sitting over a
            populated stagedChapters is the setup for the worst bug available
            in this panel — clear the fields, parse book B, and Upload All
            writes B's chapters under book A's id.
         2. ⚠️ THE DROPDOWN'S OWN RESET WAS DEAD CODE. bookSelect.onchange has
            always cleared the new-book fields, and it never ran after an
            upload. loadBookList(false) silently restores whatever was selected
            before, and during a new-book upload that is "__NEW__" — so the
            picker was ALREADY on "Create New Book...", re-picking it changed
            no value, and no change event fired. Jake's screenshots showed
            turn-of-the-screw / The Turn of the Screw / Henry James still in the
            form while the file input held a different book.
            After an upload the picker now points at the book that was just
            created. That makes it honest about what exists, and makes "Create
            New Book..." a genuine change next time so its reset fires.
            ⚠️ Set SILENTLY — never dispatchEvent('change') there. onchange
            hides the staging area and reassigns activeBookId, which would throw
            away chapters that were just uploaded and are still worth auditing.
            Same trap documented on loadBookList's selectFirst parameter.
         3. onchange never cleared new-book-author, which has been auto-filled
            from <dc:creator> since v3.14.0, so the previous book's author sat
            in the form for the next one.

#### v3.18.0

         RE-ENTRANCY GUARD ON OPEN BOOK — the actual cause of the scrambled
         staging list, found by taking the numbers seriously instead of
         theorising about the code a fourth time.

         Loading a book is one sequential round trip per chapter — 13 for Tom
         Sawyer Abroad, 284 for Aesop — so there is plenty of time to click the
         button again mid-load. Both handlers then reset `stagedChapters = []`
         and push into the same array as their awaits resolve: the second reset
         discards what the first had collected, and the two loops interleave
         from wherever each had reached.

         The reported order was 4, 5, 1, 6, 2, 7, 3, 8. That is not random —
         it is (4,5,6,7,8) interleaved with (1,2,3), one run continuing while
         another started over. Reconstructed step by step it matches digit for
         digit. The stored `chapters` array was perfectly sequential the whole
         time, which is why "Repair Chapter Order" correctly reported clean and
         why no data was ever at risk.

         ⚠️ Third instance of this bug class in the project, after game.js
         flushAll() (duplicate typing_sessions, double-counted minutes in
         teacher reports) and learn.js flushStats(). The shared shape: an async
         handler that resets module state before its first await. Grep for
         `= []` or `= {}` at the top of an async function and ask what happens
         if it runs twice.

         Guard released in a `finally` so a failed load cannot leave the button
         permanently disabled.

#### v3.17.0

         stagedChapters is now sorted by chapter id after both load and parse.
         Del, Merge ↓ and Split all operate on array INDICES and all three end
         with `stagedChapters.forEach((ch, i) => ch.id = i + 1)`, so an
         out-of-order array was not cosmetic: one Del click would have
         rewritten every id from the wrong positions, and Merge would have
         merged two chapters that only looked adjacent. Sorting the array
         rather than the render is deliberate — sorting only the render would
         have fixed the appearance and left the index operations still reaching
         for the wrong rows.

         ⚠️ STILL OPEN: that renumber flattens part-aware ids. Delete one
         chapter from Heidi and 1.01-2.09 becomes 1-22. Needs the part scheme
         threaded through all three handlers. Avoid Del/Merge/Split on a
         multi-part book until then.

#### v3.16.0

         Chapter titles are tidied on import. Project Gutenberg headings arrive
         as "I. TOBY'S INTRODUCTION TO THE CIRCUS"; the number is already the
         document id, and shouting is harder to scan than mixed case, which is
         the one job a chapter list has.

         stripLeadingOrdinal() removes exactly one leading ordinal, and only
         when text remains behind. ⚠️ The trap is "I AM BORN": "I" is both a
         Roman numeral and an English word, so a bare-numeral rule turns David
         Copperfield's first chapter into "Am Born". A single-character numeral
         is therefore stripped only when punctuation follows it — that is what
         distinguishes an ordinal from a pronoun. "CHAPTER I. I AM BORN" strips
         one ordinal and correctly yields "I Am Born".

         toTitleCase() runs ONLY when a title is at least 90% uppercase. A
         mixed-case title was set deliberately and is left byte-identical —
         "The Tale of Peter Rabbit" needs no help. Capitalisation happens after
         hyphens and slashes but never after an apostrophe, so TOBY'S becomes
         Toby's rather than Toby'S; these titles are full of possessives and
         that is the case a naive implementation always breaks.

         A bare ordinal passes through untouched, because Pride and Prejudice
         and Gatsby genuinely do not name their chapters and "II" is the best
         available title. 14/14 on a fixture set covering both directions of
         the "I Am Born" case.

#### v3.15.0

         1. ⚠️ parseFloat CANNOT COMPARE PART NUMBERS, AND EVERY SORT USED IT.
            parseFloat("1.10") is 1.1 — the SAME VALUE as parseFloat("1.1"). So
            1.1 and 1.10 were not merely misordered, they were
            indistinguishable, and 1.2 sorted after both: a two-part book came
            out 1.1, 1.10, 1.11, 1.2. A dotted id is not a number, it is a
            sequence of numbers, so chapterSortKey() splits on the dot and
            compareChapterIds() compares element-wise as integers. Both sort
            sites (Upload All, Repair Chapter Order) now use it.
            ⚠️ This fixes books ALREADY numbered by hand with no renumbering,
            so no student's stored chapter pointer moves. Running the existing
            "Repair Chapter Order" button on a multi-part book is now enough.
         2. New ids are also zero-padded, as a second line of defence for any
            naive numeric sort elsewhere. Width is taken from the largest part
            in the BOOK so every id in one book has the same shape — Heidi
            becomes 1.01-1.14 and 2.01-2.09, not a mix. A book whose largest
            part is under ten chapters stays unpadded (1.1-1.9), because there
            is nothing to disambiguate and the short form reads better.
         3. REPAIR TOOL: "Remove chapter titles from typed text". For books
            uploaded before v3.13.0, whose segment zero repeats the chapter
            title. Re-importing would fix it and cost the titles Jake typed by
            hand, renumber everything, and orphan student chapter pointers —
            this drops the duplicate first segment and nothing else. Titles and
            ids untouched. Previews every change and waits for confirmation,
            because a false positive would silently delete a real opening line;
            titlesMatch() compares on letters and digits only, and requires a
            whole-string match so a sentence that merely BEGINS with the title
            is never touched. Bumps contentVersion so students see it at once.

#### v3.14.0

         1. PART-AWARE NUMBERING. v3.13.0 numbered every body chapter 1..n,
            which is right for a novel and destructive for a book with internal
            divisions — it flattened Heidi's two parts, which Jake had
            hand-numbered 1.1-1.13 and 2.1-2.8, into a single run of 1-23.
            The signal was in the filenames all along: Standard Ebooks names a
            multi-part chapter `chapter-{part}-{n}.xhtml` and drops
            `part-1.xhtml` / `part-2.xhtml` in as dividers. Heidi now imports
            as 1.1-1.14 then 2.1-2.9; Pride and Prejudice, with no parts, is
            unchanged at 1-61. A book needs two or more distinct parts before
            the scheme engages, so single-part books cannot be affected.
            Position within a part is POSITIONAL, not the book's own ordinal —
            Heidi's chapter-2-1 is headed "XV" because that edition numbers
            straight through, but 2.1 is what Jake wants and what he had. One
            rule therefore covers both restart-at-1 and continue-from-14 books.
            Part divider files carry a heading and no prose, so they yield zero
            segments and drop out with no special case.
         2. METADATA AUTO-FILL. Every field the create form demanded was
            already in the EPUB. Confirmed across the 20 test books:
            <dc:title> 20/20, <dc:creator> 20/20, <dc:subject> in most. Picking
            a file now fills title, a slugified book id, author, and a genre
            guess from dc:subject. Nothing already typed is ever overwritten,
            and a metadata read that fails leaves the manual path untouched.
            ⚠️ Only the FILE is required to parse now. The old gate demanded id
            and title up front — which is why the author extraction that had
            existed inside parseEpubFile for versions never saved anyone any
            typing: you had to type the metadata to earn the right to press the
            button that read the metadata.

            Age range remains the one field that cannot be derived and still
            needs a human.

#### v3.13.0

         Ran the shipping import code against 20 real EPUBs in a Node harness
         (jszip + jsdom) rather than reasoning about it. Two bugs, both silent.

         1. EVERY SPINE DOCUMENT WAS BECOMING A NUMBERED CHAPTER. Standard
            Ebooks' `imprint.xhtml` — their publishing boilerplate — was
            chapter 2 of every book in the library, and `titlepage.xhtml` was
            chapter 1. That shifted the real chapters by a different amount per
            book: Pride and Prejudice's Chapter I sat at position 3, Gatsby's at
            5, Douglass's at 6. Aesop reported 289 fables instead of 284 for the
            same reason. classifyDocument() now reads epub:type
            (frontmatter/bodymatter/backmatter), which resolved 18 of the 20
            test books; the two Gutenberg files fall back to filename then
            shape. Counts now match the actual books — P&P 61, Gatsby 9,
            Alice 12, Wind in the Willows 12, Pinocchio 36, Douglass 11,
            Aesop 284.
         2. CHAPTER TITLES WERE BEING TYPED INSTEAD OF READ. Standard Ebooks
            marks a titled chapter as an <hgroup> holding the ordinal in the
            heading and THE TITLE IN A <p epub:type="title">. headingTextOf()
            only queried h1-h6, so it returned "II" and never saw "Old Tom and
            Nancy" — twelve of twenty books, every one of which Jake retyped by
            hand. And because the title was a <p>, querySelectorAll('p') swept
            it into the prose, making the chapter title SEGMENT ZERO of what
            students type. headingInfoOf() returns title, ordinal, and the
            elements to exclude; the caller honours that list. Pollyanna: 32
            titles read, 32 title paragraphs removed.

         Numbering (assignChapterIds): body chapters 1..n so chapter 1 is
         chapter 1; front matter 0.1, 0.2; back matter 900.1, 900.2 — high
         enough never to collide with the 1.1 / 2.1 convention for books with
         internal parts. Front and back matter are LABELLED in the staging
         list, not hidden; some of it is real prose worth typing (Aesop's
         Introduction, Douglass's Preface). `bodyChapters` is written to the
         book document separately from `totalChapters` so "finished the book"
         can be judged on the story — Jake's catch: keeping the colophon meant
         a student never got the completion celebration.

         ⚠️ Also fixed a bug introduced by v3.12.0's own paragraph
         reconciliation: it counted the deliberately-stripped title paragraphs
         as lost text, so Pinocchio would have warned "36 paragraphs did not
         reach any chapter" in amber on every import. Caught by the regression
         run, which is the check earning its keep.

#### v3.12.0

         1. contentVersion IS NOW WRITTEN. game.js has invalidated its cached
            chapter text on `books/{id}.contentVersion` since v3.4.0, and no
            version of this file had ever set it. The chapter cache therefore
            had only its expiry, so an edited chapter took up to seven days to
            reach a student. bumpContentVersion() is called from all seven
            paths that change chapter text. A failed bump is non-fatal on
            purpose — the chapter save it follows already succeeded.
         2. THE TOC IMPORTER WAS DROPPING PARAGRAPHS. In
            chapterUnitsFromToc(), `current` started null, so every <p> before
            the FIRST TOC anchor was skipped and never reached a chapter.
            Content between anchors was always safe; content after the last
            anchor was safe. The loss case was the run-up to anchor one — a
            dedication, an epigraph, a transcriber's note sharing a file with
            chapter I. Orphans are now prepended to the first unit rather than
            dropped, and if more than half a file's paragraphs fall outside
            the TOC the whole TOC route is declined as a bad map of that file.
         3. PARAGRAPH RECONCILIATION. Every import counts <p> elements seen
            per spine file against <p> elements actually placed into a
            chapter, and warns in amber on any shortfall. The importer will
            keep getting cleverer; this is what will say so when a clever
            change loses text.


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

## `index.js` (Cloud Functions)

Current: **v1.6.0**

#### v1.6.0

         1. DELETED ~360 LINES — the seven abandoned custom-claims functions
            (setStaffRole, setStaffReadScope, lookupStaffCandidate, listStaff,
            syncMyClaims, revokeStaffRole, resyncStaffClaims). No client called
            any of them and no security rule consulted the claims they wrote;
            admin.js v3.0.0 replaced the model with a staff/{uid} document read.
            ⚠️ Removed rather than left alone because dead code in an
            undeployable file is not harmless: syncMyClaims was callable by any
            signed-in user, and the header's "only generatePractice is deployed"
            was true only until someone ran `firebase deploy`, which would have
            shipped an access-control system the rules no longer read.
         2. The daily practice limit is now a TRANSACTION. It used to read the
            count, spend several seconds generating a paragraph, then write
            count + 1 — so two overlapping calls both read 2, both wrote 3, and
            the student got extra turns. The slot is reserved BEFORE generation,
            which means a failed generation costs one of the five. Deliberate:
            a limit that can be bypassed by causing failures is not a limit.
         3. A 429 NO LONGER FANS OUT. It used to fall through the whole
            six-model chain, so thirty students hitting the practice unlock at
            the same moment — they all start class together — became up to 180
            API calls, making the quota problem worse the harder it was hit. A
            429 now stops immediately with a friendly message. 5xx and 404 are
            per-model faults and still fall through.

         `package.json`: Node 18 (decommissioned for Cloud Functions deploys) →
         22, firebase-functions ^5 → ^6, firebase-admin ^12 → ^13.

---

## `learn.js`

Current: **v2.2.1**

#### v2.2.1

Round 5 (Mignon). flushStats()'s re-entrancy guard was `if`, which serialises
two callers and lets three or more overlap — the identical defect as game.js
v3.9.0, introduced in the same round by the same analogy that found the bug in
the first place. Now `while`. Verified by lifting the shipping function into a
harness at 2, 3, 6 and 12 concurrent callers: one inner run at a time, no
caller dropped. learn.js was never uploaded, so production was unaffected.

#### v2.2.0

The cost headline of the Round 4 audit. game.js had accumulated a caching
layer over several versions; learn.js never got any of it, and learn.js is
the page 6th and 7th graders open every day. A returning student cost ~5
reads in game.js and ~115 here, for the same ten minutes of typing.

         1. LESSONS CACHED, validated by getCountFromServer(). Firestore
            bills an aggregation at one read per up to 1000 matched index
            entries, so checking the cache costs ONE read instead of
            re-reading ~80 documents. A count catches added or removed
            lessons instantly; an edit to an existing lesson is caught by the
            4-hour TTL. That trade is deliberate and documented at the code.
         2. loadLessons() DOUBLE-FIRED ON MOST LOADS. The guard was
            `if (allLessons.length === 0) await loadLessons()` in the auth
            handler, with a fire-and-forget call at module load. Auth settles
            in ~200ms and the fetch takes ~300ms, so the guard tested a
            length that had not been populated yet and ran the biggest read
            in the app a second time. An in-flight promise is the only thing
            that closes that race; the old comment acknowledged it and the
            old guard did not.
         3. lessonProgress cached 8h, uid-namespaced, written through on
            every flush so the cache tracks what this tab already did.
         4. GOALS CACHED 24h, sharing game.js's exact ttb_goalsCache_v1 key,
            so a student who opens both pages in a day pays one read. An
            entry written by game.js lacks className and is treated as a miss
            rather than blanking the class banner for a day.
         5. pendingClassAssignments read SKIPPED when the student already has
            a class. It was firing on every login, for every student, to find
            nothing. loadGoals() now runs first so classInfo is populated in
            time to make that decision.
         6. flushStats() re-entrancy guard — same class of bug as game.js
            flushAll(), reachable from the timer, visibilitychange,
            beforeunload and walRecoverLearn().
         7. Hidden-tab flush floored at 60s. The run-position localStorage
            write still fires on every hide.

         All caches are uid-namespaced. A shared cart machine must never hand
         one student's progress to the next one who sits down.

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
