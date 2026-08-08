# CHANGELOG

<!-- CHANGELOG.md v1.3.0 — created 2026-08-02 by Blick.
     v1.3.0 — Round 6 (Noiseless), second pass: four documents recovered from outside
              the repo and committed — TTL-GUIDE.md v1.4.1 (verified accurate),
              HANDOFF-round3.md (Rounds 1-3, contains the definitive document map at
              its §10), SCALE-PLAN.md v1.3.0 (status corrections only, arithmetic
              untouched) and MULTITENANCY.md v1.1.0 (⚠️ superseded; committed only
              because a warning header makes it safe to read). Three documents remain
              missing; HANDOFF-round4.md never existed at all.
     v1.2.0 — Round 6 (Noiseless): four entry blocks were filed under ## `game.js`
              that describe index.html and style.css, and every section's entries
              were re-sorted newest-first. The ordering claim below was aspirational
              until now; game.js, admin.js and index.html were all out of order.
              Nothing was deleted — the move was line-accounted both ways.
     v1.1.0 — Round 4 (Oliver): the cost/grades/stability audit pass. -->

The full per-file history. **File headers carry only the last six entries** — see
the header budget rule in `README.md`. Anything older lives here and nowhere else.

Versions are newest-first within each file. A file's runtime constant is the
authority for what's actually running; this document is the story of how it got
there.

## Contents

- [`game.js`](#gamejs) — currently v3.14.0
- [`adventure-renderer.js`](#adventure-rendererjs) — currently v1.4.0
- [`admin.js`](#adminjs) — currently v3.24.2
- [`index.js`](#indexjs-cloud-functions) — currently v1.6.0
- [`learn.js`](#learnjs) — currently v2.2.4
- [`index.html`](#indexhtml) — currently v3.6.1
- [`style.css`](#stylecss) — currently v3.5.0

- [`lessons-admin.js`](#lessons-adminjs) — currently v1.7.1

Files not listed here have short headers that fit the budget on their own:
`staff-admin.js`, `keyboard.js`, `versions.js`, `firebase-config.js`,
`adventure.css`.

---

## `game.js`

Current: **v3.14.0**

#### v3.14.0

Round 6 (Noiseless). **game.js never consumed `pendingClassAssignments`.**

         Only learn.js did — and index.html links students straight into game.html,
         so a student who typed a book chapter before ever opening the Lessons page
         was never assigned to their class. ttbClassId stayed '', so every log
         document written that session carried classId: '', making the student absent
         from every class-filtered report and denying them their class's daily and
         weekly goals. It self-healed whenever they happened to open learn.html,
         which could be days. On day one of a 9-week rotation it is every newly
         imported student at once, and it is silent.

         Also: **the goals cache defeated the fix in both files.** loadGoals() writes
         ttb_goalsCache_v1 with a 24 HOUR lifetime, so an unassigned student's cache
         entry says classId: ''. applyPendingClassAssignment() writes the real class
         and then calls loadGoals() to pick it up — which hit the entry written 200ms
         earlier and returned the empty value again. learn.js's cache guard rejects an
         entry with a classId but no className, and '' is falsy, so it sailed through
         as a hit. Both pages share the key, so the poisoned entry followed the
         student between them. Both now clear it before re-reading.

         Verified by student-flow-test.mjs, which is new and walks a cold-start
         student's first sign-in against the shipping functions. It fails four
         assertions on the pre-fix code.


#### v3.13.1

Round 6 (Noiseless). **Header only — no code changed in this release.** The header
was 73 lines with 7 version entries against this project's own 60-line / 6-entry
budget, which versions.js reports in index.html's build panel. v3.12.0 and v3.11.0
moved out; both were already here in full. Uploading this file is optional and can
be batched with the next real change.


#### v3.13.0

Round 5 (Mignon). The last of the body-list fixes, and the Classic end credits.

         1. THE PROGRESS BAR'S SEGMENTS were built from bookMetadata.chapters, so
            the bar drew a stripe for the title page, imprint, dedication, appendix,
            endnotes, colophon and uncopyright page — ten stripes for a two-chapter
            book. The labels went to the body list in v3.10.0 and the second label
            in v3.12.3; the GEOMETRY never did, so the bar was drawn against one
            denominator and filled against another. Sixth site in this file. The
            updater walks the same list now instead of relying on half its lookups
            silently finding nothing.
         2. END CREDITS IN CLASSIC VIEW, in the text stream — where the book was,
            because that is what just ended. v3.12.2 put a link in the stats modal,
            which is the wrong surface: the modal is a stats card that lives in the
            keyboard area. Title, author, source, licence, who prepared the text,
            then links to the book's own notice pages and back to the library.
            ⚠️ NOT a duplicate of index.html's About panel: that renders the stored
            notice PAGES (a subcollection read each), this is the one-line
            attribution already on the book document, which costs nothing.
         3. bookComplete now carries the credit fields, so the renderer can scroll
            its own version over the canvas without a second Firestore read.
            Adventure's scrolling credits are NOT built — that is canvas animation
            and it needs eyes on it running.

         ⚠️ creditLine() shipped with the SAME injection hole index.html's
         linkifyText() had already been fixed for: \S+ for the URL, and
         escapeHtmlG() is DOM-based so it does not escape quotes. A licence value
         carrying `https://x.test/"onmouseover="alert(1)` closed the href early. The
         second time in one round, which is the argument for the test that caught it
         rather than for trying harder to remember.

#### v3.12.4

Round 5 (Mignon). Both found by the overwrite test — which is the whole argument for
running it.

         1. furthestChapter WAS NEVER VALIDATED. v3.12.1 checked the CURRENT chapter
            against the book and left the furthest one alone, so after the fixture
            was re-imported with part numbering the start screen still offered
            "Jump to furthest point (Ch. 2)" against a book whose chapters are 1.01
            and 2.01 — and clicking it produced "Chapter 2 not found. Returning to
            the start of the book." Precisely the dead end v3.12.1's own note said it
            existed to prevent, one variable over. FORGOTTEN rather than clamped: an
            id that no longer exists is not evidence of how far anyone got, and
            snapping to a nearest match would silently move a student's record.
         2. A PART-NUMBERED BOOK RESTARTS ITS CHAPTER NUMBERS, and the picker's label
            logic prefers the title whenever it begins with "chapter" — discarding
            the id that would have told them apart. Heidi listed "Chapter 1" through
            "Chapter 14" and then "Chapter 1" through "Chapter 9" again. Treasure
            Island, Little Women and The War of the Worlds are the same shape. Jake
            hit it on the two-chapter fixture, where the Game Genie showed
            "Chapter 1" twice with no way to tell which was which. Now prefixed
            "Pt N ·", when and only when the book actually has parts, so a novel's
            picker is untouched.

         ⚠️ v3.12.3 shipped WITHOUT ITS VERSION BUMP — the CHANGELOG said 3.12.3
         while the file still said 3.12.2. Recorded here rather than quietly folded
         in, because that exact drift is what this round has spent most of its time
         catching in other people's work, and exempting myself would be worse than
         the mistake.

#### v3.12.3

Round 5 (Mignon). The chapter-count label had TWO sites and v3.10.0 only fixed one.
The condensed bar was switched to the body count; the uncondensed path still printed
every spine document, so a two-chapter book advertised "10 ch".

#### v3.12.2

Round 5 (Mignon). Two things, both from Jake testing on a real screen.

         1. THE ADVENTURE MAP DREW A DOT PER SPINE DOCUMENT. It was handed
            bookMetadata.chapters, so the title page, imprint, dedication, appendix,
            endnotes, colophon and uncopyright page were all stops on the journey.
            On the two-chapter fixture that is TEN dots for TWO chapters with the
            real ones fourth and fifth — the "funky map on the right". On a Standard
            Ebook it means every journey ends several dots past the end of the story.
            Body list only. `num` stays the real chapter id, not an ordinal, because
            the renderer matches completedChapters against it.
         2. FINISHING A BOOK NOW LOOKS LIKE FINISHING A BOOK. v3.12.0 made the event
            exist; this makes it feel like one. Names the book, and links to its
            credits at index.html#about=<bookId> — which is the honest place for
            them: someone who has just typed every word of a book is precisely who
            should get to see who made it. showStatsModal() gained an optional
            seventh parameter for the block, rather than abusing the hint slot, which
            starts display:none and is revealed conditionally. Optional and
            defaulted, so the five existing callers are untouched.

         ⚠️ Investigated and NOT a bug: Jake was signed out mid-chapter. signOut() is
         called from exactly one place in this file — the logout button's click
         handler. Nothing in any error path touches it. The WAL did its job: signing
         back in restored his position. Most likely a Google session expiry.

#### v3.12.1

Round 5 (Mignon). **The first chapter is not always called "1."** Found by Jake's
blank typing page on the parts test fixture, and it is far older and wider than
that fixture.

         Opening a book with no saved progress hardcoded `currentChapterNum = 1`
         and called `loadChapter(1)`. A part-numbered book's first chapter is
         "1.01", so chapter_1 does not exist: "Book content not found", or in
         Adventure mode a blank page with a stick figure and no text.

         ⚠️ NOT INTRODUCED BY THE FIXTURE. This has been true for **Heidi, Treasure
         Island, Little Women and The War of the Worlds** since part numbering
         shipped in admin.js v3.14.0. Any student opening one of those four for the
         first time got a blank book. It stayed invisible because those four were
         only ever opened by an account that already had progress stored, which
         supplied a real id and bypassed the default.

         Sixth appearance of "the id is not a number" in this project. Five sites,
         plus loadChapter()'s own not-found recovery, which ALSO went to "1" and was
         therefore a dead end on exactly the books that needed it — reporting "Book
         content not found" about a book whose content was fine. And the error
         screen's "Go to Chapter 1" button, same assumption.

         Stored progress is now VALIDATED against the book's body list, and falls
         back to the first real chapter with a console warning if the id has gone.
         That is the protection Fix C's renumbering needs: a student whose progress
         points at Toby Tyler's old chapter_22 lands at the start instead of nowhere.

#### v3.12.0

Round 5 (Mignon). Found because Jake asked whether he still has to delete front
matter. He does not — but only after this, because v3.11.0 was half a fix.

         1. AUTO-ADVANCE WALKED THE FULL SPINE. v3.11.0 filtered the chapter
            PICKER and left both "next chapter" paths iterating
            bookMetadata.chapters. That is worse than not filtering at all: the
            picker told a student the colophon was not a chapter, and then the
            Continue button handed it to them. Finishing the last chapter of a
            Standard Ebook offered the colophon, then the uncopyright page. Both
            sites now walk bodyChapterList().
         2. TWO MORE parseFloat-ON-AN-ID FALLBACKS, the fourth and fifth instances
            in the project. `parseFloat(currentChapterNum) + 1` turned Heidi's
            "1.14" into a request for "2.14" — nonexistent — and "1.01" into
            "2.01", which exists and is in the WRONG PART. Finishing Augie's
            chapter 19 offered "Ch. 20". Gone; the recovery path uses the first
            real id in the body list instead of assuming numbering.
         3. FINISHING A BOOK IS NOW A THING THAT HAPPENS. With the arithmetic
            removed, a null next-chapter MEANS something: there is no next body
            chapter, so the story is over. Shows the chapter stats with "That was
            the last chapter — you finished the book." This is the completion
            moment admin.js has been writing bodyChapters for since v3.18.x and
            which had never had a consumer — because the old code invented a
            chapter number rather than noticing, so a student who finished a book
            got an error instead of a congratulation. Judged on the BODY list, so
            an appendix, endnotes, a colophon and an uncopyright page no longer
            stand between a kid and the end of the story.

#### v3.11.0

Round 5 (Mignon). The student chapter picker offers **body chapters only**.

         buildChapterOptions() listed every document in the spine, so "Ch. 0.2" —
         the imprint, the copyright page, the colophon — sat in the picker as
         something to type. Which made deleting front matter on import the only
         safe workflow, and THAT deleted the copyright notice a Creative Commons
         licence requires be kept intact. A UI default was quietly setting a legal
         constraint.

         Front and back matter now stay in the book, where the notice belongs, and
         never reach a student. If a preface or an author's introduction IS worth
         typing — §B.7's point, and Baum's introduction is a real instance — flip it
         to Body with the button added in admin.js v3.19.0. One switch, one meaning:
         body means typeable.

#### v3.10.0

Round 5 (Mignon). **Stop doing arithmetic on chapter ids.** Requested as "the
part-id renumber sites outside admin.js" — there were none of those, but there
were four parseInt()-on-an-id sites in this file, which is the same disease.

         An id is a LABEL. Part-numbered books use ids like "1.14" (Heidi,
         Treasure Island, Little Women, The War of the Worlds) and
         parseInt("1.14") is 1. Consequences, all on the book progress bar:

         1. Every one of Heidi's fourteen part-one chapters was labelled "1" and
            all nine part-two chapters "2".
         2. bookProgressFraction() found the current chapter with
            `parseInt(c.id) === parseInt(currentChapterNum)`. Since
            parseInt("1.01") === parseInt("1.14"), findIndex() returned the FIRST
            chapter of the part, so the position marker never left the start of
            part one however far the student read.
         3. isCurrent/isPast were computed the same way, so THE WHOLE PART
            rendered as current simultaneously. Measured: reading chapter 1.14 lit
            14 segments as current. Now 1.
         4. The condensed-bar label counted every spine document, so Aesop
            advertised "290 ch" including the colophon and the uncopyright page.

         Position now comes from the chapter list by exact string match, via
         bodyChapterList() / bodyOrdinalMap(). Two fallbacks, because the data is
         not uniform: `matter` when admin.js v3.19.1+ wrote it, otherwise the ID
         CONVENTION from assignChapterIds (front 0.x, back 900.x). ⚠️ THAT SECOND
         FALLBACK IS LOAD-BEARING — without it a legacy document's front matter
         would count as body chapter 1 and shift every ordinal, which is worse
         than the bug being fixed. Verified: legacy and modern documents both
         yield 23 body chapters for Heidi with identical ordinals.

         The map is built once per render, not once per segment — Aesop has 284
         chapters and this is the loop the v3.6.0 audit already had to rescue.

         ALSO: the progress document now carries bodyIndex and bodyTotal. This is
         the only place with the chapter list loaded, and index.html strips that
         list before caching the grid, so those two integers are what let a CACHED
         library card place a part-numbered book. Same write, no extra billing,
         and neither field is written when the reader is in front matter — a
         made-up position is worse than none. Closes the known limitation logged
         against index.html v3.3.1.

         Verified with ordinal-test.mjs, which lifts the three helpers out of this
         file and runs them over a v3.19.1 document, a legacy document and a plain
         novel.

#### v3.9.3

Round 5 (Mignon). **Firefox's Quick Find no longer fires on every apostrophe.**

         The typing listener is bound to `document`, not to an input, so nothing
         absorbs a keystroke on our behalf — and only space, Tab and Enter were
         cancelled. Every other printable character was consumed by handleTyping()
         AND handed to the browser.

         Firefox still ships Quick Find, the type-ahead-find feature it inherited
         from Netscape: `/` opens Quick Find and `'` opens Quick Find (links only).
         Apostrophes are in every contraction and possessive, so a student typing
         "don't" or "Toby's" popped the find bar several times per paragraph.
         Chrome never implemented type-ahead find, which is exactly why this was
         invisible at school and broken on a home machine.

         `e.key.length === 1` catches every printable character while leaving named
         keys alone. ⚠️ The modifier guard is load-bearing — without it Ctrl+R,
         Ctrl+T and Cmd+Tab get swallowed and the kid is trapped in the tab.
         Backspace is included because handleTyping() consumes it and Firefox
         historically navigated BACK on it outside a text field.

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

Current: **v1.4.0**

#### v1.4.0

Round 6 (Noiseless). **End-of-book credits for Adventure — closing a dangling event,
not adding a nicety.**

         `game.js` has emitted `ttb:bookComplete` with the full credit payload since
         v3.13.0, and nothing listened: one emit, zero listeners in the entire repo.
         `game.js` also reads `if (VIEW_MODE !== 'adventure') renderClassicCredits()`
         — so Adventure was deliberately opted out of the DOM credits in favour of a
         canvas version that was never written. A student finishing a book in
         Adventure saw no credits at all. The library is CC-licensed and attribution
         is a licence term, so this was a compliance gap wearing the costume of a
         missing feature.

         Content mirrors `renderClassicCredits()` field for field — By / Source /
         Licence / Text prepared by, in that order, plus the chapter count. Two views
         of one book should not credit it differently, and an absent field is dropped
         rather than credited blank. A book with no metadata says so in words instead
         of scrolling an empty reel.

         **The geometry is three pure exported functions, and it is tested.** Two
         earlier rounds declined this work because canvas animation cannot be watched
         from a session like this. That is true of APPEARANCE and false of POSITION
         OVER TIME — the same distinction v1.3.0's condensed-map bug had been hiding
         behind. `creditsContent()`, `layoutCredits()` and `creditsScroll()` take
         injected text measurement and no canvas, and `credits-scroll-test.mjs`
         asserts 3 viewport heights against 4 book shapes: nothing visible at t=0,
         monotonic motion, every row fully visible at some point, the last row
         resting on screen, no row exceeding the wrap width, and a watchable duration.
         It **holds** at rest rather than scrolling away, so a student who looks up
         late still finds the attribution.

         The draw call is wrapped in try/catch and clears itself on failure. It runs
         inside the requestAnimationFrame loop, where an exception would stop the loop
         and freeze the whole canvas — figure, terrain, map — over a decorative
         feature. Also cleared on `ttb:textLoaded`, so opening another book does not
         leave the last one's credits pasted over live typing.

         ⚠️ **What is NOT verified: how it looks.** Fonts, colours, and whether the
         parchment wash sits well over the terrain need one human look. `#modal` is a
         329px bottom panel rather than a full-screen overlay, so the reel is visible
         behind the completion stats — the same relationship Classic's credits already
         have with that modal.


#### v1.3.0

Round 6 (Noiseless). **Condensed map (>40 chapters): two bugs, both invisible on the
book they were tested against.**

         `frac` read `curIdx / n`. First, it ignored within-chapter progress, so the
         "you are here" marker froze for an entire chapter and then jumped — while
         the DOTTED map inks the current chapter to `progress` and creeps smoothly.
         Second, it disagreed with the dotted map by a whole chapter: v1.2.0 fixed
         the denominator to n but left the numerator alone, so dotY placed the marker
         at (i+1)/n (the END of the current chapter) and this placed it at i/n (the
         START). Crossing the 40-chapter threshold moved the marker backwards.

         On Aesop's 284 fables a chapter is 0.35% of the strip and neither is
         noticeable. On a 41-chapter book — one past the condensing threshold — it is
         2.4% of a 500px strip, so the marker is stuck for ~12px of travel while the
         student works. Now `(curIdx + progress) / n`, which at progress = 1 equals
         dotY(curIdx) exactly. Asserted numerically in map-geometry-test.mjs at 41,
         60 and 284 chapters — canvas geometry is arithmetic, so it is testable
         without watching it run.


#### v1.2.0

Round 5 (Mignon), with a correction in Round 6 (Noiseless).

⚠️ **This version shipped with RENDERER_VERSION still reading `'1.1.0'`.** The
code, this entry and the file's header comment were all v1.2.0; only the runtime
constant disagreed — and that constant is the one copy versions.js reads, so the
build panel would have reported 1.1.0 for a correct deploy. Corrected in Round 6
with no change to the code; map-geometry-test.mjs passing against the v1.2.0
geometry is what established which of the two was lying.

**A dot marks the END of a chapter, not its start.**

         dotY was `top + span * i / (n - 1)`, which puts dot 0 at the very top. But
         segment i runs dot[i-1] → dot[i] and represents TYPING chapter i, so
         segment 0 had nowhere to go: from a 14-pixel stub above the top down to dot
         0, also at the top. Finishing the first chapter of a two-chapter book drew a
         14-pixel squiggle; finishing the second drew the entire height in one
         stroke. Jake's report was exact — "the squiggle at the top is all that the
         first chapter did, and the long straight line is from writing an entire tab
         key."

         `(i + 1) / n` gives every chapter an equal 1/n slice and puts the dots where
         a reader expects: finish 1 of 2 and you are halfway down. Measured across the
         real book sizes — 2, 12, 23, 34 and 284 chapters — first chapter lands at
         1/n and the last at 100% in every one.

         The condensed path (over MAP_MAX_DOTS chapters) divided by n-1 for the same
         reason; also fixed. Invisible on Aesop's 284, a whole chapter out on twelve.

         The `length < 2` guard became `< 1`: it only existed because the old formula
         divided by zero on a single chapter, and a one-chapter book deserves a route.

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

Current: **v3.24.2**

#### v3.24.2

Round 6 (Noiseless). **"No flagged language found" was answering a different question
than the one it appeared to answer.**

         `scanForLanguageIssues()` silently drops any match on this book's approved
         list, so a book with every flag approved reports zero issues — and the
         zero-issues branch rendered a green tick reading "No flagged language found".
         That reads as "this text is clean". It is not the same claim.

         Found the honest way: Jake approved "queer" and "gaily" on a book whose upload
         then failed for an unrelated reason (v3.24.1), re-ran the audit on the next
         attempt, and got a clean bill of health on text he knew contained both. He
         reasonably assumed the approvals had been forgotten. They had not — they were
         in localStorage, doing precisely their job, invisibly.

         Compounding it: the approved-word list and its "Clear all" link were rendered
         ONLY in the has-issues branch. Once approvals suppressed every warning the
         state was both invisible and unreachable from the UI, with no way back short
         of devtools. `wireClearApprovals()` is now factored out and called from both
         branches.

         The message now reads "No UNAPPROVED language found", names the approved
         words, keeps Clear all reachable, and states plainly that approvals are
         per-browser and are not part of the book record.

         ⚠️ **The underlying design issue is unchanged and is now recorded in HANDOFF
         §4.2:** approvals live in `localStorage` under `ttb_approved_lang_{bookId}`,
         not on the book document. They do not travel to another device, they are not
         visible to anyone else, and a browser reset loses the entire review pass.

         Also: ARCHIVE_BASE_DEFAULT corrected to
         `https://typethatbook.misterwilson.org/library`.


#### v3.24.1

Round 6 (Noiseless). **⚠️ ADDING A NEW BOOK WAS IMPOSSIBLE. Found by Jake's console,
not by me.**

         `uploadAllBtn.onclick` called `val('active-book-title')`. `val` was declared
         `const` INSIDE `readBookMetadataForm()` — a different function — so the call
         was a ReferenceError. It sits in the ELSE branch of the overwrite check, the
         one that runs only for a book that does not exist yet; the `alreadyExists`
         branch reads `bookTitlesMap` and was fine.

         So re-uploading an existing book worked perfectly and adding a new one died
         before writing a single document. Broken since v3.23.0, when that confirm
         was introduced, and completely hidden by an already-imported library where
         every upload is an overwrite. Safari names it ("Can't find variable: val");
         Chrome buries it in an unhandled rejection, which is why it went unreported
         for three versions.

         `val()` hoisted to module scope. Also corrected ARCHIVE_BASE_DEFAULT to
         `https://www.misterwilson.org/library`.

#### v3.24.0

Round 6 (Noiseless). **Two import fixes.**

         **(1) The metadata autofill was being erased one click after it ran.**
         `autofillFromEpub()` fires on the file input's `change` event, so the fields
         are populated before Parse is ever clicked. v3.23.0 then added a clear of
         genre, ages, protagonist, source, licence, archive, cleanedby and origin, so
         a second import could not inherit the first book's tags — a correct fix in
         the wrong order. It wiped exactly what autofill had just written. The
         guarded re-fill higher up could not save it: that only fires when the id or
         title is blank, and autofill had filled those too.

         Since v3.23.0, every new-book import silently lost every field except title,
         author and cover — which survive only because they live outside the cleared
         set. It presents as "the importer never read the metadata", which is the
         opposite of the truth. Autofill now re-runs after the clear; it is safe to
         call twice because it only ever writes into an empty field.

         **(2) Archive URL fills from the picked file's name** against
         ARCHIVE_BASE_DEFAULT, overridable at runtime via `window.TTB_ARCHIVE_BASE`.
         Jake asked for this and it was lost across a handoff.


#### v3.23.3

Round 6 (Noiseless). **One comment, corrected — but the comment was load-bearing
misinformation.**

         The AUTH block opened with "Staff identity from Auth custom claims (see
         firestore.rules)". Four lines below it, the code's own comment said the
         opposite: "the role comes from staff/{uid}, NOT from Auth custom claims."
         The code does the latter. Two comments, four lines apart, in direct
         contradiction.

         Claims were the Round 1 design. `firestore.rules` v2.0.0 reversed it, and
         the reversal is permanent for a structural reason: claims can only be
         written by the Admin SDK, which needs a Cloud Functions deploy, which needs
         a terminal — and this project deploys by uploading files in a browser.

         Worth naming rather than silently deleting, because the same confusion is
         why `firestore-rules.test.mjs` seeds roles as token claims and has never
         matched the rules it tests. Round 6 recovered `MULTITENANCY.md`, the
         document that specifies the claims model, which makes the stale wording
         traceable to a source instead of mysterious. See that file's header box.


#### v3.23.2

Round 6 (Noiseless). **Header refresh and the admin.html title. No behaviour
change beyond one line.**

         The header's entry list stopped at v3.18.4 while ADMIN_VERSION read
         3.23.1 — NINE releases absent from the file that implements them,
         including Delete Book, Upload All's orphan pruning, the attribution
         fields and the entire About system. versions.js's drift check compares the
         first v<semver> in the leading comment against the constant, and the top
         line was right, so the check passed while the history below it was nine
         versions out of date. Refreshed from this document and trimmed to budget.

         admin.html's `<title>` was hardcoded — HANDOFF §4.1's first open item, and
         the field that read v3.3.0 for nineteen minor versions. admin.js now sets
         document.title from ADMIN_VERSION on load, so the tab title cannot drift
         again; the static title in the HTML is reduced to a labelled pre-JS
         fallback rather than a second source of truth.


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

#### v3.23.1

Round 5 (Mignon). "Cleaned up with" → **"Cleaned up by"**. Jake's suggestion, and
the right one: the shorter label stops the circled-i hint wrapping to a second line,
and "by" is what the field actually means.

#### v3.23.0

Round 5 (Mignon). Four things, all from Jake using the panel rather than reading it.

         1. DELETE BOOK. There was no way to remove a book from this panel at all;
            the only route was the Firebase console. Typed confirmation rather than
            an OK button, because confirm() is one careless Return from gone and this
            loops over every chapter document. Counts the chapters BEFORE asking so
            the number in the prompt is a fact. Chapters are deleted before the book
            record: a half-failure then leaves a visibly broken book that re-uploading
            fixes, where the other order leaves an invisible pile of orphans.
            ⚠️ Does NOT delete users/{uid}/progress/{bookId} — those live under each
            student and this panel cannot enumerate them safely. They become orphans
            pointing at nothing, which is harmless and recoverable. The prompt says
            plainly that a student mid-book loses their place and that their typing
            history does not. The cover stays in Storage and the success message says
            where it is.
         2. A NEW BOOK NO LONGER INHERITS THE LAST ONE'S TAGS. autofillFromEpub()
            only fills a field that is EMPTY — deliberately, so it cannot argue with
            something typed by hand — but nothing cleared those fields between books.
            So importing a second EPUB in one session kept the first one's genre,
            ages and protagonist and the autofill politely declined to correct them.
            That is why the Flat Edition arrived tagged **Adventure** when its
            dc:subject says Humor: left over from the book before it. Only the
            NEW-book path clears; the overwrite path must keep the metadata it is
            about to re-save.
         3. "Overwrite <id>?" ON A BOOK THAT DOES NOT EXIST YET. The id exists as a
            variable long before it exists as a document, so the very first upload of
            every book asked about overwriting nothing. Now asks "Create X with N
            chapters?" or names the actual existing book it is about to replace.
            Training someone to click through a warning is how the real one gets
            clicked through too.
         4. ORIGIN URL, beside Archive URL as Jake asked. Archive is his copy; Origin
            is upstream. Both, because the provenance should survive whichever host
            disappears first — and because with several instances doing text passes,
            knowing which edition was cleaned matters as much as who cleaned it.

#### v3.22.1 (admin.html only)

Round 5 (Mignon). **Layout, no functionality.** Jake's screenshot made the case
better than any argument: the metadata block had become ONE row of nine columns,
each with a hint paragraph printed underneath, several of them taller than the input
they described. The inputs were squeezed to roughly six characters wide and the
licence hint ran to fourteen lines.

         Two rows now — identity/tagging on the first, provenance on the second —
         with the cover in its own fixed 120px column to the right of both, so the
         cover cannot steal width from eight inputs and eight inputs cannot squash
         the cover. Stacks below 900px.

         Hints became title="" tooltips on a circled i. Same words, on hover, zero
         vertical space.

         FRONT/BODY/BACK and EDIT were the SAME BLUE, sitting adjacent, doing very
         different things — one reclassifies a page, the other opens its text. The
         matter toggle is amber now (the colour the untagged dot already uses for "a
         judgement call") and About is green when on.

         ⚠️ admin.js IS UNCHANGED, which was the point — Jake needed to run the
         import test while this was being written. Verified: all 14 metadata element
         ids present, no duplicates, HTML balanced, and the set of ids admin.js
         expects but admin.html lacks went from 27 to 23 with NO new entries. The
         four that disappeared are the fields v3.20.0 and v3.21.0 added, which is
         the first time the panel has actually contained them.

         Also set the hardcoded page title to v3.22.1. It had said v3.3.0 since
         admin.js was at 3.3.0 — nineteen minor versions ago. admin.html still has no
         version constant of its own; that is a separate job.

#### v3.22.0

Round 5 (Mignon). Upload All PRUNES orphaned chapter documents. It wrote the
chapters it had and never removed ones it did not, which was survivable while ids
were stable and is not now that v3.18.5's Fix C renumbers the Gutenberg books.

         Re-importing Toby Tyler, whose chapters move from 3–22 to 1–20, would have
         left chapter_21 and chapter_22 in the subcollection permanently: readable,
         billable, and loadable by any student whose stored progress still pointed at
         them. Deliberately runs AFTER the book document is written, so a failed book
         write leaves the old chapters intact rather than deleting content the new
         list never replaced. Non-fatal on error and reported in the completion line.

         ⚠️ There is still NO delete-a-whole-book function in this panel. Overwrite
         is the supported path and is now safe; deleting a book means the Firebase
         console.

#### v3.21.0

Round 5 (Mignon). **"About this book."** Jake's question — if nobody can SEE that
the rules are followed, are they followed? — turned out to have a smaller answer
than it felt: the standard is discoverable, not unavoidable, and a licence URI is
sufficient. What was actually missing was the copyright notice, because the
workflow deleted it.

         `about` is a new boolean on each chapter, ORTHOGONAL to `matter`. matter
         says whether a page is typeable; about says whether it is part of the
         credits; those cross. A chapter is typeable and not credits. A colophon is
         credits and not typeable. An author's real preface is neither. Collapsing
         them into one field is the mistake — so this is a second flag, and the
         About view renders EVERY chapter carrying it in id order. Standard Ebooks'
         colophon AND uncopyright both appear with nothing special-cased.

         Auto-set on import from filename and epub:type (imprint, copyright,
         uncopyright, colophon, licence, rights), and only ever for non-body
         documents — a chapter is never credits whatever it is called. Toggled per
         row with an ℹ button that appears ONLY on non-body rows, so a 31-chapter
         novel grows four buttons, not thirty-five.

         ⚠️ ALSO FIXES A SILENT DATA LOSS. Open Book's chapter push never carried
         `matter`, so opening a book and re-uploading it reset every front and back
         matter document to 'body' — classification was only ever correct on the
         FIRST import, and the About flag would have evaporated on the second. Both
         now restore from the stored chapter list.

         Source and Licence became dropdowns sharing readSelectOrCustom /
         writeSelectOrCustom, generalised from readGenreField — which existed
         because Upload All once stored the literal string "__custom__". Three
         fields with that shape means one reader, not three chances to repeat it.
         New Archive URL (provenance, not compliance) and "Cleaned up with" fields.

         THE DOT NOW NAMES WHAT IS MISSING. v3.7.0 checked age alone; it now checks
         age, cover, licence and about, and prints "· needs: cover, licence" beside
         the title. A hollow dot on forty books says there is work without saying
         what, which is how the age backlog sat. '' for licence now means "not
         decided", because public domain is an explicit dropdown choice rather than
         an absence.

#### v3.20.0

Round 5 (Mignon). **Attribution fields.** Prompted by Jake asking where the credit
for a Creative Commons book is supposed to go. Forty public domain books needed
none of this; the first CC book needs it as a condition of use, and the schema had
nowhere to put it.

         Two fields, Source and Licence/rights, because Creative Commons' own TASL
         formula is Title-Author-Source-Licence and the first two are already on
         the card. Both auto-fill from the EPUB — dc:rights for the licence,
         dc:source then dc:publisher for the edition — so the one field with a legal
         obligation attached is populated before Jake types anything. When a licence
         IS found the autofill status goes amber and says so, because it changes what
         has to appear on the library card and is easy to scroll past.
         Blank is written as '' rather than omitted, so clearing a field can clear a
         stored value (§A.14).

         ⚠️ Attribution belongs on the CARD, NOT IN THE TYPED TEXT. A student meets
         and chooses the book on the card, which is what "a manner reasonable to the
         medium" asks for. Putting it in the typing stream would make a child type
         the credit as prose and corrupt the very work being credited.

         Also retired the "multiple" protagonist option. It was a synonym for
         "ensemble" and having both split the student age/gender filter's results
         across two values for one concept.

#### v3.19.2

Round 5 (Mignon). Eleven more names in MATTER_FILE_NAMES, found by importing a real
book rather than by reading code: Augie and the Green Knight ships an
acknowledgements page, and v3.18.4's filename rescue had no entry for it, so it
displayed as "Front matter 1". Added acknowledgements/acknowledgments, foreword,
afterword, prologue, epilogue, glossary, bibliography, notes, errata, imprimatur.

#### v3.19.1

Round 5 (Mignon). Each chapter in the book document now carries its `matter`
class. bodyChapters has been written since v3.18.x with **no consumer**, and this
is why: a reader could see how many body chapters there were but not WHICH ones,
so it could not turn that number into a position. chapterMeta was `{id, title}`.

         ⚠️ Old book documents lack the field. index.html v3.3.1 falls back
         accordingly; re-upload a book to populate it.

#### v3.19.0

Round 5 (Mignon). Prompted by Jake asking whether the importer deletes anything.
It does not — but checking the answer turned up the reason that mattered.

         1. RELABEL, DON'T DELETE. Every matter class in this file is a GUESS: a
            filename pattern, an epub:type, a heading shape, or v3.18.5's
            leading-matter test. The staging row offered Merge, Split, Edit and
            Del but NO WAY TO SAY "that IS a chapter" — so the only remedy for a
            misclassified chapter one was to delete it, which is the opposite of
            what anyone wanted. New Body/Front/Back button cycles the class,
            re-derives every id, and reports the new body count. The badge tooltip
            already showed matterWhy; now the verdict can be overruled.
            This is what makes v3.18.5's three uncertain books (Oz_g, Scranton
            Chums, Camp Fire Girls) a one-click correction rather than a reason to
            distrust the whole fix.
         2. DELETING A CHAPTER NO LONGER FLATTENS EVERY ID. §B.13 item 4, open
            since v3.14.0. Three sites — Delete, Merge and Split — did
            `stagedChapters.forEach((ch, i) => ch.id = i + 1)`, which turns Heidi's
            1.01–2.09 into 1–22 and collapses front matter's 0.x and back matter's
            900.x into body positions. All three now call assignChapterIds(), which
            is the function that knows about parts and matter classes.
            ⚠️ These two fixes had to ship together: the relabel button is only
            useful if re-deriving ids is correct, and editing the staged list is
            exactly the workflow that trips the flattening bug.

#### v3.18.5

Round 5 (Mignon). **Fix C — front matter hiding inside a bodymatter file.**
Measured across Jake's full 42-book library, not two examples.

         classifyDocument() classifies a whole spine FILE; the TOC route then
         splits that file into units and every unit inherits the file's class. So
         a title page, contents list, dedication or e-text credit sharing a file
         with chapter one all became BODY chapters. This hit 9 of the 11 Gutenberg
         books and pushed real chapter numbering out by 1 to 4 — a kid told to
         type chapter 1 of The Crimson Sweater got "E-text prepared by David
         Edwards, Graeme Mackreth…". Reclassified as FRONT, never deleted: §B.7
         keeps front matter visible and labelled, so Baum's real Introduction
         stays available, just not as chapter 2.

         Signals, in order: a front-matter title vocabulary; a publisher/credit
         pattern; the heading equalling dc:title or being its leading words; the
         heading equalling dc:creator; stranded subtitle debris ("OR"); and a
         narrow dedication pattern. ⚠️ ONLY RUNS BEFORE THE FIRST REAL CHAPTER —
         the first body unit that does not match switches the filter off for the
         rest of the book, so nothing after chapter one can be touched.

         ⚠️ The dc:title test is ONE-DIRECTIONAL by design. Also testing
         heading.startsWith(dc:title) would fire on any book whose title is a
         short name its chapters reuse — dc:title "Heidi" would have swallowed a
         chapter called "Heidi Goes to the Mountain".

         RESULT: 33 of 42 books unchanged in body count. 9 changed, all Gutenberg.
         Five land exactly on canonical — Dracula 27, Toby Tyler 20, Rebecca 31,
         Outdoor Girls 25, HS Left End 25 — and Crimson Sweater's 27 matches
         Jake's own corrected count.

         ⚠️ THREE NEED A HUMAN EYE BEFORE THIS IS TRUSTED: Wizard of Oz_g lands on
         23 against a canonical 24, Scranton Chums on 19 against Jake's 20, Camp
         Fire Girls on 12 against Jake's 13. All three may be over-removing by one.
         The suspected cause is the dc:title test: Gutenberg often repeats the book
         title as an <h1> directly above chapter one IN THE SAME UNIT, so
         reclassifying that heading can take chapter one's paragraphs with it.
         Verify against those three before relying on Fix C.

#### v3.18.4

Round 5 (Mignon). Two importer fixes aimed at the non-Standard-Ebooks sources,
each measured against all eight of Jake's real EPUBs BEFORE shipping. Combined
they change 9 chapters — every one of them front or back matter — and move **no
body chapter's id on any book**, which is the §B.7 invariant that keeps a
student's stored chapter pointer where it is.

         1. FRONT MATTER CANNOT FOLLOW BODY MATTER. Toby Tyler's final spine file
            — the Gutenberg licence: zero paragraphs, no heading, no keyword in
            its filename — classified as 'front', which gave it id 0.2 and
            therefore SORTED IT TO POSITION 2 OF THE BOOK. A document that appears
            after the story has started is not front matter by definition,
            whatever its shape looks like, so `seenBodyMatter` reclassifies it as
            back. Fires exactly once across the eight books: on the one file that
            had the bug.
         2. A NON-CHAPTER IS NEVER TITLED "Chapter N". composeChapterTitle() falls
            back to the running counter for any document without a usable heading,
            regardless of kind — so Gatsby's dedication.xhtml was "Chapter 3" and
            Alice's frontispiece.xhtml was "Chapter 4", numbers that were not even
            those items' ids, sitting in the staging list beside real chapters.
            §B.7 keeps front matter visible and labelled rather than hidden, which
            only works if the label is true. Named from the filename now
            (dedication → Dedication, loi → List of Illustrations), falling back
            to "Front matter N" / "Back matter N" for the opaque names Global Grey
            and some Gutenberg builds use (index_split_001). Only consulted when
            the old code produced a bare "Chapter N", so a real title is never
            overwritten.

         ⚠️ STILL OPEN, deliberately: Toby Tyler's title block and table of
         contents become BODY chapters 1 and 2, pushing its 20 real chapters to
         3–22. classifyDocument() classifies a whole spine FILE, and the TOC route
         then splits that file into units which all inherit 'body' — so
         front-matter units INSIDE a bodymatter file are invisible to the
         classifier. Fixing it needs per-unit classification against a title
         vocabulary, and tuning a vocabulary on two examples is how you overfit.
         Waiting on the full corpus.

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

Current: **v2.2.4**

#### v2.2.4

Round 6 (Noiseless). Goals-cache half of the class-assignment bug — see game.js
v3.14.0 for the full account, since the two files share the cache key and the defect.


#### v2.2.3

Round 6 (Noiseless). **`beginStep()` called a function that does not exist.**

         `if (!currentStep) { finishLesson(); return; }` — and there is no
         finishLesson() in learn.js, or in any other file in this repo. The
         completion path has always been finishStep() -> showLessonResultModal().

         The guard exists to catch currentStepIdx landing outside currentRuns, so
         it fired only in the situation it was written to rescue, and when it fired
         it threw a ReferenceError. The throw abandons beginStep() BEFORE the intro
         panel is hidden or the keyboard is wired, so the student is left on a dead
         drill screen with no modal, no error and no route back but the browser's
         Back button. Nothing is written, which means it is also invisible from the
         teacher side — the exact failure mode the Batch A/B instrumentation exists
         to eliminate.

         Reachable two ways, both real. The Game Genie's step jump calls
         beginStep(parseInt(select.value)) with no bounds check. And a saved run
         checkpoint outlives a lesson edit: re-chunking a five-run step into three
         leaves a resume pointing at run 4 of 3. startLesson() bounds-checks the
         resume it reads, but the checkpoint itself survives.

         Recovery is stopLesson(), not completion. `!currentStep` means the run list
         and the index disagree; grading a run that does not exist would write a
         score for work nobody did. clearRunPosition() goes with it so a stale
         checkpoint cannot bounce the student straight back out.

         Also in this release: the mid-drill resume condition read
         `!drillModal.classList.contains('hidden') === false`. That is CORRECT —
         unary ! binds tighter than ===, so it reduces to "the modal is hidden" —
         but it is shaped exactly like a typo, and the next person to touch it will
         "fix" it into its own negation. Rewritten as two named booleans, with
         equivalence checked across all four input combinations first.


#### v2.2.2

Round 5 (Mignon). Same Firefox Quick Find fix as game.js v3.9.3. handleDrillKey
is bound to #drill-keyboard, which is a **div** — a div absorbs nothing, so
Firefox was free to act on anything not cancelled, and lessons drill punctuation
on purpose.

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

---

## `lessons-admin.js`

Current: **v1.7.1**

#### v1.7.1

Round 6 (Noiseless). **Two functions were wired into the UI and never written.**

         admin.html has the whole "Add one student" form — #student-one-section,
         #student-one-email, #student-one-class, #student-one-add-btn — and
         initStudentsPanel() attached listeners for both `_populateOneStudentClasses`
         and `_addOneStudent`. Neither was declared anywhere in the repo.

         That is not a dormant feature. `addEventListener('click', _addOneStudent)`
         EVALUATES the identifier, so initStudentsPanel() threw a ReferenceError at
         that line and never reached anything after it:

         · Preview CSV and Commit CSV were never wired, so the roster import
           buttons did nothing at all;
         · the Lessons/Books progress tabs were never wired;
         · loadStudentRoster() is the last statement in the function, so the roster
           never loaded — an empty student table was the only visible symptom;
         · and `_studentsInited = true` is set BEFORE the throw, so reopening the
           tab took the early-return path and rebuilt two dropdowns instead of
           recovering. Broken for the rest of the session.

         Both functions were written from _commitCSV() and _bulkAssign() rather than
         from scratch, because the single-student case is exactly one iteration of
         the bulk loop: same users/{uid} vs pendingClassAssignments/{email} split,
         same rule that schoolId must ride along on a create, same roster-cache
         update. admin.html's own help text ("If they haven't, the assignment waits
         for them and applies on their first sign-in") describes the pending path,
         which is how the intent was confirmed rather than guessed.

         Found by undefined-calls-test.mjs, which is new this round and exists
         because of this class of defect. Grep finds one hit for `_addOneStudent`
         and it looks like a reference to something real.

---

## `index.html`

Current: **v3.6.1**

⚠️ **This section was created in Round 5.** index.html had no CHANGELOG section at
all, despite carrying the student-facing library grid, the age/genre filters and
the progress bars — and despite being one of only two files that got the
single-version-constant discipline right (INDEX_VERSION drives both the title and
the footer, since v3.0.1). Entries before v3.3.1 live only in the file header.

<!-- Relocated here in Round 6 (Noiseless). This block was filed under
     ## `game.js`, which never contained the code it describes. -->
#### v3.6.0

Round 5 (Mignon). **"The index page is ugly" was not a styling problem. The markup
was invalid.**

         v3.5.0 put a licence `<a>` and an About `<button>` INSIDE the card, which
         was itself an `<a>`. HTML forbids both: an anchor may not contain another
         anchor or a button. Browsers do not ignore that — they RECOVER from it, and
         the recovery closes the outer `</a>` early and reparents everything after
         the offending tag. Which is exactly what Jake saw: the credit line splitting
         mid-sentence, half of it and the About button sitting on the page background
         outside the card, the card's white background stopping short.

         Measured with card-markup-test.mjs, which parses the output as a real DOM:
         the v3.5.0 structure yields TWO grid children instead of one, with both the
         credit and the About button outside the card. The `<a>` now wraps only the
         cover and metadata; credit and About are siblings inside a plain `<div>`
         card. Nine structural assertions across three book shapes.

         ALSO:
         · CACHE KEY BUMPED to ttb_booksCache_v2. The cache stores a snapshot of the
           book objects, so v3.5.1's aboutTitles never reached a browser that already
           had a cache — for up to six hours. That is why Jake still saw "NOTICE" on
           every About section AFTER the fix shipped: the code was live and the data
           feeding it was stale. ⚠️ Any future change to what is cached needs this
           number bumped or the change silently does nothing.
         · ARCHIVE URL WITHOUT A SCHEME is a relative path.
           "typethatbook.misterwilson.org/library/x.epub" resolved against the
           current page and produced ".../typethatbook.misterwilson.org/library/x.epub".
           Now prefixed with https:// when no scheme is present, and any non-http(s)
           scheme is refused rather than rendered as a link.
         · Opens the About panel on arrival at index.html#about=<bookId>, from
           game.js v3.12.2's completion screen. Hooked into all THREE paths that
           populate allBooks — fresh, cached and stale-cache — because a reader
           arriving from the completion screen must get the panel regardless of which
           one served them.

<!-- Relocated here in Round 6 (Noiseless). Filed under ## `game.js`, which
     does not render the About panel. HANDOFF §7 records the bug as index.html’s. -->
#### v3.5.1

Round 5 (Mignon). Three rendering bugs, all found by Jake's screenshots rather
than by me reading the code.

         1. `[object Object]`, once per paragraph, where the copyright notice
            should have been. **A segment is `{ text: "…" }`, not a string** —
            admin.js has always stored it that way — and String({}) is
            "[object Object]". I wrote `escapeHtml(String(t))` without ever
            checking the shape. Also strips the leading tab admin.js prepends for
            paragraph indentation: meaningful when typing, just a gap when reading.
         2. Every section headed **"Notice"**. The lookup used `book.chapters`,
            which the grid STRIPS before caching — the same fact that made
            `aboutIds` necessary in v3.5.0, applied to the ids and not to their
            titles. `aboutTitles` is now captured at load time alongside them.
         3. The card credit printed a **raw URL as its own link text**, so "CC0 1.0
            Public Domain Dedication https://creativecommons.org/publicdomain/zero/1.0/"
            became four wrapped underlined lines that dwarfed the book's title. The
            licence VALUE containing its URI is correct and deliberate — a licence
            URI is what CC asks for — so the fix belongs in the rendering. New
            creditLinkFor() uses the label as the link text and keeps the URI in the
            href, shared by the card and the panel.

         Verified with about-render-test.mjs: eight segment shapes including {} and
         undefined, three headings from a cache-stripped book, and six credit values
         including one carrying an event-handler injection in both the label and the
         URL.

<!-- Relocated here in Round 6 (Noiseless). This block was filed under
     ## `game.js`, which never contained the code it describes. -->
#### v3.5.0

Round 5 (Mignon). The **About this book** panel. Renders the pages flagged
about:true — imprint, colophon, licence, uncopyright — VERBATIM, from the
document actually being served. Not a paraphrase on a card, not a link to a copy
hosted somewhere else. That is what a Creative Commons notice asks for, and it is
what deleting front matter was destroying.

         ⚠️ COST. The credits TEXT is a chapters-subcollection read, one document
         per page, and is NOT fetched on page load — only when someone opens the
         panel, then cached for the session. A book nobody asks about costs nothing.
         `aboutIds` is extracted from the chapter array at LOAD time precisely
         because that array is stripped before caching, so the ℹ button survives a
         cached grid while the text does not need to.

         The ℓ button renders only when a book HAS credits pages, so a book whose
         front matter was deleted shows nothing rather than an empty box. A failed
         subcollection read leaves the credits block standing, since that block is
         what carries the licence URI.

         ⚠️ The card is itself an <a>, so the ℹ handler needs preventDefault AND
         stopPropagation or clicking it navigates into the book. Delegated once at
         init rather than rebound per render.

         linkifyText() was hoisted to module scope and is now shared by the card and
         the panel — two copies of an escaping rule is one copy too many. This broke
         credit-test.mjs, which was extracting it by matching source text, and that
         is the correct thing for the test to have done. Now nine cases including a
         hostile book id in the button's data attribute.

#### v3.4.0

Round 5 (Mignon). Renders the attribution line on the library card, under the
author, in deliberately quiet type — it is a legal requirement rather than
something a ten-year-old needs to read, and it must not compete with the title.
Renders NOTHING when both fields are empty, which is every public domain book in
the library. URLs become links with target="_blank" and rel="noopener noreferrer",
so a student clicking a licence does not lose their place in a book.

         ⚠️ SECURITY. This string is admin free text going into innerHTML.
         index.html's escapeHtml() is DOM-based (textContent -> innerHTML), which
         neutralises < > & but NOT quotes — quotes need no escaping in element
         content, and very much do inside an href. The first draft matched URLs with
         [^\s<]+, so a "URL" of
             https://x.test/"onmouseover="alert(1)
         survived escaping, matched as a single URL, and closed the href early to
         inject an event handler. Fixed by excluding quotes from the URL character
         class AND escaping them in the attribute — both, deliberately.

         Verified with credit-test.mjs across a CC book, a public domain book,
         partially-tagged books, two XSS attempts and a two-URL field. The test
         PARSES the output as a DOM rather than regexing it, because an earlier
         version flagged correctly-escaped "&lt;img onerror=...&gt;" as unsafe on the
         strength of the literal text — the only way to tell an attribute from text
         that resembles one is to build the DOM and ask.

#### v3.3.2

Round 5 (Mignon). Reads bodyIndex/bodyTotal off the progress document when
game.js v3.10.0 has written them, which closes v3.3.1's known limitation: a
part-numbered book on a CACHED grid can now be placed exactly, because those two
integers survive the cache while the chapter list does not. Preference order is
progress fields → chapter list → arithmetic, so every older combination still
degrades the way v3.3.1 documented.

#### v3.3.1

Round 5 (Mignon). Two bugs in the library progress bar, one of them ugly.

         1. THE DENOMINATOR COUNTED FRONT AND BACK MATTER. totalChapters includes
            the imprint, the colophon and the uncopyright page, so finishing every
            fable in Aesop still left three pages between the reader and 100% and
            the bar never filled. This is bodyChapters' first consumer — the field
            has been written since v3.18.x with nothing reading it.
         2. parseInt() ON A CHAPTER ID. Part-numbered books use ids like 1.01 and
            2.09 — Heidi, Treasure Island, Little Women, The War of the Worlds.
            parseInt("2.09") is 2. **A student who had finished all 23 chapters of
            Heidi saw "Ch. 2 / 27" and a bar at 7%**; one fourteen chapters in saw
            "Ch. 1 / 27" at 4%. For a project whose open question is why students
            stall without generating progress data, a progress bar that does not
            move is not a cosmetic defect. The ordinal now comes from the chapter
            LIST rather than from arithmetic on the label.

         Degrades in three steps, because the data is not always present: chapter
         list available → exact ordinal among body chapters; list stripped (the grid
         strips it before caching, it being the largest field on the document) or
         document older than admin.js v3.19.1 → parseFloat rather than parseInt, so
         2.09 rounds to 2 instead of truncating silently; no bodyChapters at all →
         previous behaviour exactly.

         Verified with progress-test.mjs, which lifts the patched block out of the
         file and runs it over a part-numbered book, a cache-stripped document, a
         pre-v3.19.1 document and a garbage progress value.

         ⚠️ KNOWN LIMITATION: from a CACHED grid a part-numbered book still reads
         low, because the exact ordinal needs the chapter list. The proper fix is for
         game.js to write the body ordinal alongside progress. Queued, not done.

---

## `style.css`

Current: **v3.5.0**

⚠️ **Section created in Round 5.** style.css had no CHANGELOG section despite owning
every colour a student reads. Entries before v3.4.0 live only in the file header.

<!-- Relocated here in Round 6 (Noiseless). This block was filed under
     ## `game.js`, which never contained the code it describes. -->
#### v3.5.0

Round 5 (Mignon). **`#modal-body` no longer uses `justify-content: center`.**

         That property on a scrollable flex container CLIPS THE OVERFLOW AT THE
         START, and the clipped region cannot be scrolled to — the scrollbar appears
         and works, but everything above the scroll origin is unreachable. Which is
         what Jake hit: "scroll is there, but not there enough to utilize", with the
         Game Genie title appearing to cover the chapter picker it was in fact
         sitting above. The Genie panel is the tallest thing that ever goes in this
         modal, so it is the only one that overflowed far enough to lose content.

         `flex-start` plus auto margins on the first and last child gives both
         behaviours with no @supports and no browser caveats: short content still
         centres, tall content pins to the top and every pixel stays reachable.

#### v3.4.0

Round 5 (Mignon). **Classic view contrast inverted.** `.letter` was `#ccc` and
`.letter.done-perfect` was black — light grey for the words about to be typed, full
black for the words already behind the cursor. That is backwards for the only reader
who matters: the text a student is reading AHEAD needs the contrast, and #ccc at
reading size is close to invisible for a struggling eleven-year-old. Typed-and-correct
is now `--ink-spent` (#9b968e) — legible if you look back, out of the way if you
don't. done-fixed (blue) and done-dirty stay loud, because those are diagnostics
rather than prose. The tab guide moved from #ddd to #b8b2a8, having been chosen to
sit beside light grey text and being invisible beside black.

Adventure mode was fixed this way some time ago. Classic never was, and Classic is
what a student sees by default.
