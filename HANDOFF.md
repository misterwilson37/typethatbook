# HANDOFF — TypeThatBook

<!-- HANDOFF.md v15.26.0 — consolidated 2026-08-18 by Round 14 (Sholes); amended
     through Round 40; ⚠️ RESTRUCTURED 2026-08-20 by Round 23 (Empire).

     v15.26.0 — Round 41 (Rem-Sho). ⚠️⚠️ §0.-31.A: THE "🎲 PRACTICE MISSED KEYS"
     DRILL WAS BEING GRADED AS THE LESSON'S RUN 1, IN PRODUCTION. It replaces
     currentRuns and leaves currentLesson alone, so logRun() filed a sprint under
     the lesson's id, recordRunOutcome() banked mastery points and wrote
     runCount: 1 over a 12-run lesson, and saveProgress() marked the WHOLE LESSON
     passed. ⚠️ key_random is ACCURACY-ONLY, so a clean 83-character random drill
     scored A🔥 and unlocked the next lesson. ⚠️ THE FIX IS A POSITION: the branch
     is ABOVE the isLastRun fork, because BOTH modals write and a guard in
     showLessonResultModal() alone still grades a multi-chunk drill.
     ⚠️⚠️ §0.-31.B: THE MINUTES STILL COUNT, IN BOTH RECORDS. §0.-21.C's "write
     nothing anywhere" is right for ROADMAP 10's practice run and WRONG here —
     that replays mastered material, this is a child typing keys they just got
     wrong. Only the assessment is suppressed. The result screen MUST NOT say
     "nothing was recorded"; it would be false.
     ⚠️ §0.-31.C: SPRINTS BEFORE v2.36.0 CARRY NO STAMP and cannot be told from
     real runs, so the reconstruction may grade a drill as lesson material for
     any day before today. Unfixable, and it is why nothing the button writes
     advances a student.
     ✅ §0.-31.D: ROADMAP 15 BUILT, BOTH HALVES. runGrades/runFires store the
     grade where it is earned (runScores is a SUM and cannot tell one A🔥 from two
     A's). The ⚑ button reconstructs from typing_sessions: preview → confirm →
     write, never overwrites an earned grade, NEVER touches passed/fireCount/
     runScores/grade, tags every entry runGradesFrom:'sessions', and REFUSES on
     runCount drift.
     ⚠️⚠️ §0.-31.E: THE RULES FORBADE THE FEATURE — staff could READ a student's
     lessonProgress and never WRITE it, so the button would have failed for every
     student except Jake. Rules v2.7.0 ships in the SAME round (Rule 9), scoped to
     lessonProgress ONLY, and was EXECUTED: 61 emulator cases, 7 new.
     ⚠️ §0.-31.F: run-grade.js is the ONE copy of the grade rule; learn.js's
     copies and THREE local GRADE_ORDER arrays are deleted. Part D is the ratchet
     — runPlan() computes SHAPE not content and must agree with learn.js's real
     generators on run count, or reports.html grades the wrong material.
     ⚠️ §0.-31.G: logRun() appends "(interrupted)"/"(left page)"/"(hidden)" to a
     FRAGMENT's detail — keying on the raw string invents grades from partial runs.
     ⚠️⚠️ §0.-31.H: I TRUNCATED run-all-tests.mjs TO ZERO BYTES — §0.-24 verbatim,
     having read it this session. ENCODE FIRST, TEMP FILE, VERIFY SIZE, RENAME.
     And two assertions went red against the CORRECT build by matching my own
     COMMENTS; position checks run on decomment(src) now.
     ⚠️ §0.-31.I: ROUNDS 36-40 ARE ALL WRITTEN UP AS UNDERWOOD, WHICH IS ROUND 1.
     Fourth occurrence. GREP THE ROSTER.
     ⚠️⚠️ §0.-31.N: THE ⚑ BUTTON WROTE A WRONG GRADE ONTO A REAL STUDENT AND JAKE
     SAVED IT AS ACCURATE. "u1_l5 run 1 → D (15 fragments merged)"; the true
     answer is B. THREE compounding faults: RETRIES merged as fragments (only
     `continuation: true` marks one), an abandoned 32% tail poisoning the union,
     and OVERLAPPING ROLLUPS double-counting — sessionSignature() keys on the
     whole sprint LIST so a SUPERSET is not a document-level duplicate; dedupe
     per SPRINT. 21 raw sprints → 13 real attempts.
     ⚠️⚠️ THE ROADMAP'S OWN CONSTRAINT 1 IS WRONG IN BOTH DIRECTIONS and I
     followed it. A constraint from an earlier round is a HYPOTHESIS.
     ✅ THE STUDENT WAS NEVER AFFECTED — runGrades feeds nothing. Guarantees 2
     and 3 of §0.-31.D turned a wrong write into a wrong DISPLAY and made it
     findable. ✅ The button RECOMPUTES its own tagged entries now; a
     skip-if-present rule would have frozen the bad data forever.
     ✅ AND THE GRADES NOW SHOW — the ◈ panel, reconstructed pips dimmed.
     ⚠️⚠️ §0.-31.O: NEW, NOT FIXED — ⟳ OVER-COUNTS a day with overlapping
     rollups (30m30s of sessions vs a 21m40s stored day) and THE DROP GUARD ONLY
     GUARDS DOWNWARDS, so an inflation applies SILENTLY. ROADMAP 24.
     ⚠️⚠️ §0.-31.M: NOTHING WAS WATCHING firestore.rules — not versions.js, not
     audit-versions, not version-stamp-test. I bumped its title to v2.7.0 and left
     its note stack at v2.6.0; both instruments reported CLEAN. Jake caught it by
     READING THE FILE. §0.-30.F one file over, on the security boundary of the
     whole app — the file he cannot test from a browser and pastes by hand.
     ✅ version-stamp-test.mjs v1.2.0 Section F watches it now (mutation-verified).
     ⚠️ NOT added to versions.js SOURCES ON PURPOSE: that fetches files AS
     DEPLOYED, and the rules that run live in the CONSOLE — a SOURCES entry would
     report the repo copy while implying it had checked the live ones (§0.-22).
     ⚠️ A VERSION BUMP IS NOT A NUMBER, IT IS A NOTE.
     ⭐ §0.-31.K: ROADMAP §10.H IS BUILT — Jake's FIRST ask, unbuilt for five
     rounds, and it was never a feature: scanForStuck() already reads every record
     it needs, so the per-lesson aggregate rides that sweep for ZERO extra reads.
     ⚠️⚠️ TWO COLUMNS, NOT ONE — replay-rate with a HIGH pass rate is coasting,
     with a LOW pass rate is struggling; the original spec's single "attempts"
     column cannot tell them apart.
     ⚠️ §0.-31.L: ITEMS 13 AND 11a WERE STALE ⭐⭐ FLAGS — both already fixed
     (14b/Round 31 and Round 33), headings never updated. THIS IS WHAT COST ROUND
     35 A WHOLE ROUND. When a read settles an item, change the HEADING in the same
     edit. 11a's residue is a RULING for Jake (stamp-at-write vs join-at-read).
     learn.js v2.36.0, run-grade.js v1.0.0 (NEW), reports.html v1.1.0/v2.29.0,
     lessons-admin.js v1.15.0, admin.html v1.1.0,
     versions.js v1.15.0, firestore.rules v2.7.0. 54 harnesses + 61 rules cases,
     ALL PASSING. audit:versions 0 problems (it was 1 in the repo as delivered).

     v15.25.0 — Rounds 39-40 (Underwood). ✅ §0.-30.A: THE ROSTER QUERY READS
     EVERY USER DOCUMENT IN THE DATABASE — `query(usersRef)` with NO FILTER on
     the isSuper() + "All schools" path. 501 = 167 x 3 days; 1,169 = 167 x 7.
     167 is not 101 students; ~66 are staff, old and test accounts. ⚠️ AND THE
     `students × days` LINE ON SCREEN WAS THE CROSS PRODUCT — what the sweep
     WOULD read before pruning — which misled two rounds. It reports what was
     actually read now.
     ⚠️ §0.-30.B: NOTHING HISTORICAL WAS EVER LOADED. The discovery query
     returned 104 documents, correctly date-filtered. The 501 were blind guesses,
     397 of them empty. The cost was absence, not old records.
     ⚠️ §0.-30.C: the future-date clamp was BUILT AND REVERTED. A Sat–Fri week
     pulled on a Monday really does sweep impossible days — but planReads()
     already skips a day it knows is empty. ⚠️ JAKE'S SAT–FRI DEFAULT MUST NOT
     CHANGE. ROADMAP 21 holds the three-line restore.
     ✅✅ §0.-30.D: ensureSince(). noteDay() only fires on a TYPING FLUSH, so a
     student who signs in and never types had no ledger and was swept in full
     FOREVER. Seeded from the user document both controllers already read — no
     extra read, ONE WRITE PER STUDENT EVER.
     ⚠️⚠️ §0.-30.E: writing that test found ledgerFrom() reading `since` INSIDE
     the day-array branch, so a since-with-no-days returned null — exactly the
     document ensureSince() creates. The seeding would have saved NOTHING. The
     two fields answer different questions: AN EMPTY DAY LIST IS A REAL ANSWER.
     ✅ §0.-30.F: ROADMAP 16 — build panel on both staff pages, and admin.html is
     in SOURCES at last. ⚠️ admin.js wrote footerEl.innerText, which would have
     DELETED the new button half a second after load.
     ⚠️⚠️ §0.-30.G: I DELETED A HEADER ENTRY WITHOUT ARCHIVING IT — §0.-26.C's
     failure by a different route. THE RULE IS: VALIDATE EVERY FILE, THEN WRITE
     EVERY FILE; no write before any assertion. ⚠️ And ASSERT ON THE BOUNDARY,
     not on a shape you expect.
     reports.html v2.28.0, admin.js v3.33.0, versions.js v1.14.0,
     logdays.js v1.2.0. 52 harnesses, ALL PASSING.

     v15.24.0 — Round 38 (Underwood). ✅ ITEM 19 (CONTINUE READING) BUILT for
     ZERO extra reads — §0.-29.B. ⚠️⚠️ AND THE SUITE'S "8 PRE-EXISTING FAILURES"
     WERE NEVER REAL — §0.-29.A: jsdom and acorn were DECLARED in package.json
     and simply not installed. `npm install` → ALL HARNESSES PASS, and did so
     before this round touched anything. ⚠️ THE COST WAS THE FALSE ASSURANCE, NOT
     THE FALSE NUMBER: "8 failing, none of them mine" sounded like the changes
     had been checked against card-markup-test.mjs and undefined-calls-test.mjs.
     They had not been RUN. Two rounds of index.html and game.js edits shipped
     without either. ⚠️ RUN `npm install` BEFORE READING A FAILURE COUNT.
     ⚠️ §0.-29.B: `lastUpdated` arrives as a Timestamp on a cold read and as a
     PLAIN { seconds } object after the 8-hour cache — handling only the first
     ranks every card 0 for most of the school day, and the row STILL RENDERS in
     a meaningless order. ⚠️ renderContinue() is called from renderBooks(), which
     runs from EIGHT places including sign-out — where a stale row would show one
     child's books to the next.
     index.html v3.14.0. 52 harnesses, ALL PASSING.

     v15.23.0 — Rounds 36-37 (Underwood). ✅✅ THE READ BUDGET IS MEASURED AND
     FIXED — §0.-28. A sprint session went 80 reads → 12; the library page 8 → 3;
     a report 1,155 → ~6. ⚠️⚠️ READ §0.-28.A BEFORE OPENING ANY CONSOLE: QUERY
     INSIGHTS CANNOT SEE THIS APP. Every query it reports is
     `SELECT _none_ PageSize 300` with no WHERE clause — it is profiling the
     FIREBASE CONSOLE DATA BROWSER, i.e. whoever is clicking around in it. It
     showed 7,500 reads for a week Cloud Monitoring counted 138,600 in. Cause:
     `experimentalForceLongPolling` routes the Web SDK over the Listen
     WebChannel, which Query Insights does not instrument. ⚠️ The Firebase
     "Billable Metrics" percentage is a MONTHLY total against a DAILY quota (11%
     for the month was 92% of one day's ceiling) and INCLUDES CONSOLE USAGE, so
     after-hours development reads as student traffic — 38% of the worst day was
     Jake before school started.
     ✅ §0.-28.C: read-meter.js is the only instrument that answers WHICH LINE.
     ⚠️ LEAVE IT IN. `export *` then local overrides — the ordering is what makes
     a missing symbol impossible; DO NOT tidy it into an explicit export list.
     ⚠️ §0.-28.E: THE getCountFromServer GUARD ONLY RAN ON A CACHE THAT WAS STILL
     FRESH — the one case not needing it. Past the TTL the cache was discarded
     UNREAD and 55 books refetched. index.html spent 1 read validating while
     game.js spent 55 refetching, same session, same books.
     ⚠️⚠️ §0.-28.F: logdays.js — noteDay() IS CALLED BEFORE THE typing_logs
     WRITE. A ledger entry with no log = one wasted read. A LOG WITH NO LEDGER
     ENTRY = A CHILD'S MINUTES VANISHING. The ledger must be a SUPERSET; NOBODY
     MAY PRUNE IT. ⚠️ ledgerFrom() returns null, NOT an empty ledger — an empty
     one reads as "typed on no days" and would empty every report at once.
     ✅ §0.-28.G: ITEM 18 BUILT. ⚠️ THE WRITER SHIPPED ONE ROUND BEFORE THE
     READER, ON PURPOSE — do this again for anything gating a read on a stored
     field. ⚠️ A SKIPPED DAY MUST NOT SET ok:false.
     ⚠️ §0.-28.H: I PREDICTED THE LEADERBOARD WOULD COST 0 AND IT COST 60 AGAIN.
     leaderboardCache was module scope, so its TTL only ever applied within one
     page load. ⚠️ The 0-threshold on a board under ten entries IS CORRECT and
     must not be "fixed" — see ROADMAP item 20.
     ⚠️ §0.-28.J: a test case named "…FAILURE…" failed the whole suite while
     passing itself — run-all-tests.mjs text-matches /FAIL|UNSAFE|\bERROR\b/.
     AND MY GUARD AGAINST IT WAS ALSO WRONG: assert on the PRINTED strings, not
     the source text.
     daylog.js v1.5.0, game.js v3.46.0, logdays.js v1.0.0, read-meter.js v1.0.1.
     51 harnesses, 18 of them new in logdays-test.mjs.

     v15.22.0 — Round 35 (Fitch). ⚠️⚠️ ITEM 17 MEASURED, NO CODE SHIPPED, AND
     THAT WAS THE RIGHT CALL — §0.-27. THE ITEM'S PREMISE WAS STALE: the date
     filter has been in buildScopedQuery() all along, so a round that "fixed" it
     would have changed nothing and reported a saving. THE COST IS THE ROSTER
     SWEEP — students × days, unconditionally: Jake measured 1,155 reads for SIX
     legitimate documents. ⚠️ HIS CORRECTION DECIDES THE FIX: the misses are not
     idle students, they are ACTIVE students whose data sits in another week, so
     the question is per STUDENT ("could this one have typed in range?"), not
     per day. ⚠️⚠️ THE OBVIOUS FIX — one range query per uid — IS ILLEGAL
     UNDER firestore.rules: rules run per returned document and A QUERY FAILS
     ENTIRELY IF ANY DOCUMENT IS DENIED, and a classId:'' log is denied. The
     point reads survive only because they fail ONE AT A TIME. Round 33's writer
     fix already half-solves it for NEW data. ⚠️ ONE UNMEASURED NUMBER DECIDES
     THE APPROACH: what fraction of recent logs carry a non-empty classId.
     ✅ §0.-27.E: ONE NAME PER INSTANCE, NOT PER ROUND. Rounds 31–34 had been
     written up under four names; consolidated to Fitch. 50 harnesses.

     v15.21.0 — Round 34 (Fitch). ✅ §0.-26 — A LESSON NOW OPENS AT THE FIRST RUN
     THAT STILL COUNTS. Jake, after Round 32 went live: "Scoring works! locking
     works! It did reveal that if the first one is locked, students have no way
     to get to the second run legitimately." Runs are typed in order, so a
     mastered run 1 had to be replayed FOR NOTHING to reach run 2 — THE GATE WAS
     TAXING THE STUDENT IT MEANT TO MOVE ALONG. firstOpenRunIdx() is well-defined
     because downward closure makes the mastered runs a PREFIX and the open runs
     a SUFFIX; loosen closure and it must be REWRITTEN, not patched.
     ⚠️ BOTH intro entry points hardcoded beginStep(0) — button AND Enter key.
     Fixing one leaves which key a child pressed deciding whether the feature
     works (§0.-18's shape).
     ✅ tests/run-mastery-test.mjs IS WRITTEN — learn.js had cited it in its own
     header SINCE ROUND 32 WITHOUT IT EXISTING. 18 checks, 8 failing against
     v2.34.1.
     ⚠️⚠️ §0.-26.C: I DELETED LIVE CODE while archiving a header entry — the
     last `// vX.Y.Z —` in learn.js is in the BODY, not the header. BOUND THE
     SEARCH: slice at `const LEARN_VERSION` and search only above it. Second
     file-destroying tooling error in three rounds; both caught only because the
     suite ran. RUN IT AFTER EVERY CHANGE.
     learn.js v2.35.0. 50 harnesses.

     v15.20.0 — Round 33 (Fitch). ✅ ROADMAP ITEM 11 IS FIXED — §0.-25 is the
     write-up. Jake's son was in his class and not his school for three rounds.
     ⚠️ TWO INDEPENDENT BUGS IN TWO FILES PRODUCING ONE COMPLAINT, WHICH IS WHY
     TWO CORRECT DIAGNOSES PRODUCED NO FIX: the WRITER omitted schoolId (two of
     three assignment paths), and the READER cached "no class" for 24 hours
     because classId '' is FALSY and slipped through the hit-guard. Fix either
     alone and the symptom remains.
     ⚠️⚠️ §0.-25.B: the obvious repair reads _classCache, WHICH IS COLD until
     the Classes panel is opened — it would have written '' and looked correct.
     _schoolIdForClass() falls back to the class document and is the ONE
     answerer. The CSV lookup is PER ROW: a rollover file can name a different
     class on every line.
     lessons-admin.js v1.14.0, learn.js v2.34.1, class-assign-test.mjs (10
     checks, 6 failing against the shipped build). 49 harnesses.

     v15.19.0 — Round 32 (Fitch). ⭐⭐ ROADMAP ITEM 14 IS BUILT — §0.-24 is the
     write-up. Mastery is cumulative points per RUN (A🔥 = 2, A = 1, B and below
     = 0, locked at 4), locked by run, unlocked by lesson, clock from the last
     lock. lesson-gate.js v1.1.0, learn.js v2.34.0.
     ⚠️⚠️ §0.-24.A IS THE MOST IMPORTANT PART AND IT IS NOT ABOUT THE FEATURE.
     JAKE'S STANDING RULE, IN HIS WORDS: "GIVE ME A HANDOFF EVERY ROUND." A round
     that produces no document produced NOTHING — the code lands in a repo the
     next instance cannot interpret. Write it before you run out of room. This
     round reported design decisions as progress for many turns, shipped a zip
     with a red suite, and told him to "test it on Nico tonight" WHEN HE DEPLOYS
     VIA THE GITHUB WEB PORTAL AND THERE IS NO SUCH THING AS A PRIVATE TEST.
     ⚠️ §0.-24.B: I changed `>=` to `>` to close the farming hole and SILENTLY
     MOVED JAKE'S OWN WORKED EXAMPLE BY ONE LESSON. lesson-gate-test Section C
     caught it, which is why the worked example lives in a harness and not a
     document. The real fix is a guard — `if (reachBack === 0) return 'practice'`
     — with v1.0.0's comparison left untouched above zero.
     ⚠️ §0.-24.D IS WHAT IS NOT VERIFIED: runScorePill() and armRunMode() — the
     BANNER AND THE SCORE, the only two things a student sees — HAVE NEVER BEEN
     EXECUTED, and learn.js's header cites tests/run-mastery-test.mjs WHICH DOES
     NOT EXIST. Do not read 48/48 as coverage.
     ⚠️ I TRUNCATED learn.js TO ZERO BYTES mid-round with a Python heredoc that
     hit UnicodeEncodeError on a surrogate escape. Restored and re-applied. Use
     io.open(encoding='utf-8') on BOTH ends and literal emoji, never \uD83D pairs.
     ⚠️ ITEM 11 — HIS SON IS IN HIS CLASS BUT NOT HIS SCHOOL — IS DIAGNOSED AND
     UNFIXED FOR A THIRD ROUND. §6 item 9. Twenty minutes. Do it first.
     48 harnesses, all passing.

     v15.18.0 — Round 31 (Fitch). ✅ ROADMAP 14b IS FIXED — §0.-23 is the
     write-up — ⚠️⚠️ AND THE ITEM'S OWN DIAGNOSIS WAS WRONG IN A WAY THAT WOULD
     HAVE PRODUCED A FIX THAT CHANGED NOTHING. 14b said flushLessonProgress()
     has one caller in the session-end path and stopLesson() never calls it.
     THE FLUSH WAS BEING CALLED ALL ALONG — line 4778 is inside flushStats(),
     which runs on the 5-minute interval and on every hide. What lost the run is
     stopLesson()'s loadUserProgress(), whose FIRST STATEMENT is
     `userProgress = {}`: the outcomes died before the scheduled flush read
     them, while pendingProgress still named the lesson — so the flush found the
     RELOADED record under that id and wrote THAT back.
     ⚠️⚠️ THE WRITE SUCCEEDED. It returned true, cost a billed write, cleared
     the queue and stored the numbers it had just read. THERE IS NO ERROR PATH
     HERE AND THERE NEVER WAS ONE, which is why a suite that has been green all
     week never saw it. ⚠️ SO "await flushLessonProgress() in stopLesson()" —
     the obvious reading of 14b — IS A FIX ONLY IF IT LANDS BEFORE THE RELOAD;
     appended to the end of the function it writes the same stale document and
     every test that asks "is the flush called?" goes green. THE ORDER IS THE
     FIX, and exit-flush-test.mjs Part D asserts the order rather than the call.
     ⚠️ §0.-23.C is why the loss looked RANDOM (the WAL holds the good record
     for a window, so only runs whose interval flush fired inside it landed —
     Jake's {0:1, 1:2} out of a dozen, not zero, which someone would have
     reported). ✅ "Next Lesson →" was never affected; only "← Map" lost work,
     and Jake named that path precisely. ⚠️ §0.-23.D: the harness had to
     REPRODUCE the defect before it could prove the fix, and two modelling
     details were load-bearing — the page state must be real BINDINGS (the
     defect IS a reassignment), and `merge: true` merges nested maps KEY BY KEY,
     which is precisely why {0:1, 1:2} survived at all.
     ⚠️ §0.-23.E is a trap in the runner: it marks a harness bad on a TEXT
     match for FAIL/UNSAFE/ERROR anywhere in its output, so a harness printing
     "PASS — 31 passing, 0 failing" is still reported FAIL if a section header
     contains the word. DO NOT LOOSEN IT; the rule is that a harness must not
     print those words except on a real failure, and it is now in the runner's
     header. ⭐⭐ ROADMAP ITEM 15 IS THE NEXT BUILD and has absorbed Jake's
     reconstruction button — typing_sessions.sprints[] carries lesson, run
     index, wpm, accuracy and mistakes, so a lost run is recomputable, ⚠️ BUT
     IT CANNOT RUN OFF typing_logs (a DAY AGGREGATE with no lesson and no
     per-run WPM) and the item's three constraints are not optional — the
     run-index one can grade the wrong material silently. ✅ THE "NO BULK
     REPAIR" RULING IS AMENDED TO MINUTES on Jake's instruction.
     ⚠️ ROADMAP §10.H — THE MEASUREMENT — IS STILL NOT BUILT, fourth round.
     ⚠️ ITEM 11 IS DIAGNOSED AND NOT FIXED: §6 item 12 now names BOTH direct
     writers (lessons-admin.js:1129 and :1776 write classId and never schoolId,
     while learn.js's import path writes both and says why) and the 24-hour
     goals cache that keeps Settings saying "No class assigned" after a correct
     assignment.
     learn.js v2.33.1. 48 harnesses, all passing.

     v15.17.0 — Round 30 (Postal). ⚠️⚠️ §0.-22 — THE BUILD PANEL ANSWERED FROM A
     COPY IT TOOK AT PAGE LOAD. Its cache lived in sessionStorage, which SURVIVES
     A HARD RELOAD and clears only in a new tab, so the one instrument that
     reports what is deployed could not be refreshed by any action a person would
     think to try. Jake: "force refreshing is not refreshing everything. I have to
     close the tab and open a new one." NOT his browser, NOT the files.
     ⚠️ THE INDIVIDUAL FETCHES WERE ALREADY `cache: 'no-cache'` AND SAID SO IN A
     COMMENT — a correct component behind a wrong cache is a wrong system, and
     the comment made the whole thing read as considered. Now module state with a
     60s TTL: module state DIES WITH THE PAGE, which is the lifetime the old
     comment already claimed. DO NOT MOVE IT BACK TO ANY STORAGE THAT OUTLIVES A
     PAGE LOAD. ⚠️ Three layers of staleness became one — game.js and learn.js
     each kept their own `dataset.loaded` early return on top of it, and none of
     the three expired inside a tab. ⚠️⚠️ §0.-22.B IS THE PART TO READ: this is
     the THIRD way this same instrument has lied in three rounds (§0.-14,
     §0.-20.A, §0.-20.B), and the reason is structural — a diagnostic is consulted
     INSTEAD of checking, so when it is wrong nothing disagrees with it.
     ⚠️ §0.-22.D: THE SITE IS GITHUB PAGES, NOT FIREBASE HOSTING — firebase.json
     is emulator config only. GH Pages CANNOT SET CACHE HEADERS; do not propose
     it. Use a `?x=1` query string to tell "not deployed yet" from "cached".
     ⚠️⚠️ ROADMAP ITEMS 11-18 ARE NEW, FROM JAKE'S FIRST REAL TEST OF THE LESSON
     GATE WITH A STUDENT ACCOUNT, AND NOTHING HAS BEEN FIXED YET. ⚠️ JAKE THEN
     READ THE ACTUAL DOCUMENTS OUT OF THE CONSOLE AND FOUR OPEN QUESTIONS ARE NOW
     CLOSED — read items 11, 13 and 17 for the values, and DO NOT RE-DERIVE THEM:
     (a) fireCount IS 0 and grade IS "A", so THE GATE WAS NEVER BROKEN and the
     SPEC was wrong; (b) classId IS written and schoolId is ABSENT ENTIRELY, and
     Settings still says "no class" DESPITE classId being present — TWO bugs, not
     one; (c) typing_logs ALREADY CARRIES A `date` FIELD, so item 17 is a pure
     query change with NO migration; (d) typing_logs stamps classId/schoolId AT
     WRITE TIME and they are "" on every existing record, so assignment does not
     retroactively fix reports and somebody must decide stamp-at-write vs
     join-at-read ON PURPOSE. ⚠️ ITEM 14 NOW HAS JAKE'S FULL RULING — A🔥=2, A=1,
     mastery at 4, SCORED AND REACHED BACK IN RUNS, with mastering run k closing
     runs 1..k-1 of the same lesson. READ THE CONSEQUENCE SECTION BEFORE BUILDING
     IT: reach-back in runs makes the review window ~5x tighter than the number
     everyone agreed to, which weakens the one thing that justified a receding
     window over a flat cooldown. READ ITEM 13
     FIRST AND NOTE THAT ITS FIRST STEP IS A READ, NOT AN EDIT: the gate never
     fired, and the evidence in Jake's screenshot — lesson 1 showing a green `A`
     on a field that is MONOTONIC BEST-EVER-SEEN, so it can never have been A🔥 —
     points at the SPEC rather than the code. lesson-gate.js counts a LESSON
     grade; the student is shown fire on a RUN. If that holds, fireCount was
     correctly incremented ZERO times and the gate behaved exactly as written.
     DO NOT START BY EDITING THE GATE. ⚠️ Item 11 is a DATA-INTEGRITY bug: a class
     assigned without a school makes a student visible from one query and
     invisible from another. ⚠️ Item 17: reports read 1,155 records to report on
     THREE students, because the date and school filters are applied in the
     browser AFTER the read. ⚠️⚠️ ITEM 18 IS THE NUMBER THAT SHOULD CHANGE HOW
     DESIGNS ARE ARGUED HERE: Firestore reads are at 11.3% of the daily free
     quota with 135 students, WRITES ARE AT 0.2%. That is a 50x asymmetry, the
     target is ~400 concurrent users, and the current shape caps out near 270.
     TRADE READS FOR WRITES FREELY. ⚠️ ROADMAP §10.H — THE MEASUREMENT JAKE ASKED
     FOR FIRST — IS STILL NOT BUILT.
     game.js v3.45.0, learn.js v2.33.0, versions.js v1.13.0, index.html v3.13.0.
     47 harnesses, all passing.

     v15.16.0 — Round 29 (Odell). ⭐⭐ ROADMAP ITEM 10 IS BUILT — the lesson-farming
     gate. §0.-21 is the write-up. ⚠️⚠️ THE ONE SENTENCE THAT SHOULD LEAD ANY
     SUMMARY OF IT: MASTERY IS WHAT CLOSES A LESSON, AND ONLY MASTERY. A lesson
     with fewer than three A🔥 is graded and replayable forever, at any distance —
     DO NOT ADD A DISTANCE OR TIME CONDITION THAT REACHES AN UNMASTERED LESSON, it
     would invert the feature and punish the student this app exists for.
     lesson-gate.js v1.0.0 holds the whole rule and is PURE — no Firestore, no
     DOM, no clock — which is why 56 checks cover the design without a browser.
     ⚠️ §0.-21.B: THE ROADMAP NAMED AN INCREMENT SITE THAT WOULD NEVER HAVE FIRED.
     It said to count active days at the tick's day-rollover; that branch is the
     MIDNIGHT-STRADDLE path and runs only for a tab open across midnight, so the
     counter would have sat at 0 forever — AND THE FAILURE WOULD HAVE LOOKED LIKE
     SUCCESS, since reachBack 0 is indistinguishable from "everyone is advancing".
     Third instance this month of a document naming a code site that does not do
     what the document thinks (§0.-19.C, §0.-20.J). OPEN THE LINE THE SPEC CITES.
     ⚠️ §0.-21.C: a practice run writes NOTHING anywhere, and the three omissions
     are ONE decision — half of it would manufacture the exact typing_logs /
     typing_sessions divergence item 4's flag exists to catch. ⚠️ §0.-21.F: THE
     SUITE CAUGHT AN ORPHAN `async` TOKEN OF MINE AT game.js MODULE TOP LEVEL. It
     PARSES — acorn accepted it — and throws ReferenceError before any code runs,
     blanking Library for every student. "It parses" and "every reference
     resolves" are different questions. ⚠️ ROADMAP §10.H — THE MEASUREMENT JAKE
     ASKED FOR FIRST — IS STILL NOT BUILT.
     game.js v3.44.0, learn.js v2.32.0, lesson-gate.js v1.0.0 (NEW),
     style.css v3.9.0. 47 harnesses, all passing.

     v15.15.0 — Round 28 (Daugherty). ⚠️⚠️ §0.-20 IS THE WRITE-UP AND THE PANEL
     JAKE DIAGNOSES DEPLOYS WITH HAD THREE THINGS WRONG WITH IT. (1) It was
     unreadable, and ⚠️ THE CAUSE WAS NOT IN THE PANEL: adventure.css's ONE
     unscoped rule, `body footer { opacity:.55 }`, faded the whole SUBTREE in
     every view, so no amount of reading the panel's own opaque background could
     explain it. That rule was CORRECT when written — v3.5.4 hung a panel inside
     the footer afterwards. Third instance in a week of a true statement going
     false without being edited (§0.-16, §0.-19.C). (2) ⚠️⚠️ ITS LOUDEST RED LINE
     WAS FALSE ON EVERY SESSION SINCE IT SHIPPED: the renderer-drift guard
     excluded the sentinel 'failed' but not '—', the NEVER-MOUNTED one, so
     classic view — the DEFAULT view — always printed "stale module cache". A red
     alarm that is always on teaches you to discount the real ones beside it.
     ⚠️ Assert the positive SHAPE you need; never enumerate the sentinels you
     happen to know about. (3) The ⚠ notes were shown to every child who hovered
     the footer. Now staff-only and ⚠️⚠️ DEFAULTING TO OFF, so a fourth surface
     added by someone who never read this fails toward silence — but
     ⚠️⚠️ §0.-20.D IS THE PART TO READ: a gated panel still prints the COUNT,
     because Jake reads it at a student's machine signed in as nobody and a
     panel that looked CLEAN when something was wrong is §0.-14.C's failure
     direction exactly. HIDDEN IS FINE; ABSENT IS NOT. ⚠️ §0.-20.E IS TWO
     FAILURES OF MY OWN VERIFICATION and both generalise: a check that passed
     because the string was in the IMPORT LINE, and a mutation whose sed died
     and printed a pass indistinguishable from a real one. ✅ ROADMAP ITEM 9's
     HEADER BUDGET IS CLOSED on Jake's ruling — lines are PROPORTIONAL now
     (max(220, 8% of body), measured against the body so a header can't fund its
     own growth), entries are 8 and ⚠️ DELIBERATELY FLAT. 45 entries moved to
     CHANGELOG.md § ARCHIVED FILE HEADERS; ⚠️ §0.-20.G is how that nearly ate the
     Load-bearing blocks. ✅ ADMIN_EMAILS IS ONE COPY, NOT FOUR (§0.-20.H).
     ⚠️ §0.-20.J: I NAMED THIS ROUND UNDERWOOD, WROTE IT INTO SIX FILES, AND
     UNDERWOOD IS ROUND 1 — the third time, past two written warnings I had
     already read. The roster is data; the warnings are prose. GREP THE LIST.
     ⚠️⚠️ §0.-20.K: THE ROOT README.md WAS A COPY OF tests/README.md AND THE
     PROJECT README HAD BEEN GONE FOR FOUR ROUNDS. Reconstructed as v2.0.0 and
     MARKED AS RECONSTRUCTED — prefer the original if Jake has one.
     ⚠️⚠️ §0.-20.K: THIS ROUND SHIPS A CHANGED-FILES-ONLY UPLOAD SET (ROADMAP
     8b, Jake's instruction) AND THE FIRST BUILD OF IT SILENTLY OMITTED
     versions.js — the diff was right, the copy dropped its manifest's last
     line. That would have blanked both student pages via an import error in a
     file Jake never opened. CAUGHT ONLY BY APPLYING THE SET TO A CLEAN COPY AND
     RUNNING THE SUITE THERE. "Every file I edited passes" is not "these files
     are sufficient".
     game.js v3.43.0, learn.js v2.31.0, versions.js v1.12.0,
     firebase-config.js v1.3.0. 46 harnesses, all passing.

     v15.14.0 — Round 27g (Chicago). ✅ §0.-19 — THE CORNER ID STAMP IS DELETED and
     the student ID lives in Settings on BOTH pages. ⚠️ JAKE CAUGHT A HALF-BUILT
     TWIN BEFORE I DID: School's panel had the ID, Library's menu did not, and
     deleting the stamp alone would have left Library students unable to read
     their own ID — the SEVENTH twin of the week and the first that would have
     been mine. ⚠️ The pattern is structural, not carelessness: two page
     controllers that cannot import each other make every student-facing feature
     a twin BY CONSTRUCTION, so half-building one is the DEFAULT unless something
     checks. ⚠️⚠️ §0.-19.C: §2's deploy check NAMED the stamp and became false on
     deletion — a troubleshooting instruction followed at 8:05am with a class
     arriving. Rewritten to the build footer. WHEN YOU DELETE A VISIBLE ELEMENT,
     GREP THE DOCS, NOT JUST THE CODE — same defect as §0.-16's orphaned paint,
     one layer up, and the docs layer has no harness. game.js v3.42.3,
     learn.js v2.30.0, settings-panel.js v1.2.0. 45 harnesses.

     v15.13.0 — Round 27f (Chicago). ⚠️⚠️ §0.-18 — "I'M DONE" WAS A VISIBLE,
     STYLED, INERT BUTTON IN LIBRARY FOR A DAY. Round 26 shipped handleImDone(),
     the markup, the CSS and receipt.js — and attached the handler ONLY in
     learn.js. Sixth twin failure of the week and the FIRST TO REACH A CHILD.
     Symptom was silence: no handler, no error, nothing to search for.
     ⚠️⚠️ §0.-18.B IS THE LESSON: 43 harnesses passed and NOT ONE COULD HAVE
     FAILED. undefined-calls-test asks "does every reference RESOLVE" and
     handleImDone resolves perfectly — it is simply never referenced. A
     defined-but-unreachable function is outside that question BY CONSTRUCTION.
     tests/dead-handler-test.mjs asks the mirror. When a defect ships past a green
     suite, ask WHAT QUESTION NOBODY WAS ASKING, not which harness slipped.
     ⚠️ §0.-18.C: the new harness had two false-positive runs and both fixes made
     it LOOSER. ⚠️ §0.-18.D: updateWeeklyHUD() deleted — its comment claimed
     "several call sites" and there were ZERO. A comment asserting callers is not
     evidence of callers. game.js v3.42.2, learn.js v2.29.1, 45 harnesses.

     v15.12.0 — Round 27e (Chicago). §0.-17.E/F, DESIGN ONLY. ⚠️⚠️ THE FLAT 30-DAY
     COOLDOWN IS WITHDRAWN ON ONE FACT ABOUT JAKE'S ROOM: kids are with him for
     TWO MONTHS, so a flat month is a quarter of the course and opens every
     mastered lesson at once, home row FIRST. Distance had to be in the rule and
     only he knew that. Now: `reachBack = floor(activeDays/7)`, graded if
     `L >= furthest - reachBack`. ⚠️ PROGRESS RESETS IT — review reaches the
     STALLING student and not the coasting one, with nobody assessing anybody.
     ✅ PRACTICE MODE IS IN and BOTH my objections were retired — a run in NEITHER
     record creates no divergence, and it never touches the increment site
     because it never ARMS the timer (§0.-16's pause work). ⚠️ Generalise: two of
     three objections were to an assumed MECHANISM, not the goal.

     v15.11.0 — Round 27d (Chicago). §0.-17, DESIGN ONLY, NO CODE. ROADMAP item 10
     specced. ⚠️ The chapter staleness ladder is 7d→exact / 30d→sentence /
     beyond→chapter start, NEVER the start of the book, and it is a RE-UPLOAD
     DEGRADATION PATH rather than a review mechanic — the mechanism does not
     transfer to lessons, the thresholds should. ⚠️ `grade` is BEST-grade-only so
     "three times A🔥" needs a new fireCount; `completedAt` gives the cooldown
     clock free. ⚠️⚠️ §0.-17.C IS A WITHDRAWN CLAIM OF MINE: I said Rule 11
     forbade uncounted time and IT DOES NOT — time counting for neither side
     creates no divergence. Rule 11 ends discussions, so a wrong invocation is
     expensive; cite it against the MECHANISM, not the goal. The real objections
     (log vs sessions divergence by design; a condition on the one increment
     site) still stand, hence the 30-day cooldown recommendation. ⚠️ §0.-17.D:
     the override threat model is a student WATCHING JAKE TYPE IT, not
     cryptography, and a hardcoded hash cannot be rotated without a deploy.

     v15.10.0 — Round 27c (Chicago). ✅ ROADMAP 0b SHIPPED — §0.-16 is the
     write-up. settings-panel.js is the SIXTH shared module: a ⚙ in School's bar
     holding the reading font, the class, the goals and the student ID.
     ⚠️ THE CLASS ROW IS A DEBT BEING PAID — updateClassDisplay() had been
     writing to #user-class-name, an element v2.24.0 deleted in the same version,
     so the name went NOWHERE. That is §0.-13.C's orphaned paint, twice in four
     days: when a round removes an element, GREP FOR ITS WRITERS.
     ⚠️⚠️ §0.-16.B IS THE PART TO READ: Jake NARROWED "don't touch the timing
     mechanism" to mean ACCURACY, not "never stop the clock". I had read it
     strictly and built the gear to hide during a drill; the ⚙ now pauses like
     Library's. A strict reading of a recorded rule FEELS safe and goes
     unquestioned — this one would have left School permanently worse than
     Library. ⚠️ §0.-16.C: THE RISK IS THE RESUME, NOT THE PAUSE. A pause that
     never resumes is silent minutes lost. One close(), a `finally`, onClose,
     guarded on drillRunning — F7c1–c5, mutation-verified. And note the pause
     buys only ~3s: the idle gate already stops the clock. ⚠️ RULE 9 OBSERVED —
     the font model MOVED out of learn.js; F9b asserts no copy returned.
     ⭐ ROADMAP ITEM 10 IS NEW (lesson farming) and step one is a MEASUREMENT, not
     a build — `attempts` is already stored per lesson per student.
     ⚠️ THE CORNER ID STAMP IS STILL THERE pending Jake's look — §0.-16.E.
     44 harnesses, all passing.

     v15.9.0 — Round 27b (Chicago). §0.-15 IS JAKE'S TWO RULINGS, BOTH TAKEN.
     ✅ **hud.js IS v2.0.0 AND THE MAJOR IS SIGNED OFF** — no code changed, the
     number catches up with v1.3.0's breaking return-shape change. ⚠️ §0.-15.A is
     why that is not bookkeeping: a minor PROMISES the caller still works, and a
     v1.2.0 caller reads `.left`, gets `undefined`, and renders the word
     "undefined" into a child's top bar rather than throwing. ✅ **ROADMAP 9b
     CLOSED** — celebrate.js 1.1.0 and receipt.js 1.1.0 gained the constants they
     were extracted without, and all three modules are in versions.js (1.10.0),
     audit-versions.mjs (1.2.0) and the harness mirror. ⚠️⚠️ §0.-15.B IS THE COST
     REASONING AND IT IS REUSABLE: versions.js fetches STATIC FILES, not
     Firestore — no bill; localStorage CANNOT answer "what is on the server"
     because it is a cache of the very thing being checked (invariant 1's shape);
     and reporting the already-imported constants would have been free but would
     have been a FIFTH TWIN. ⚠️ The ratchet is the lasting part — D2 reads the
     writers' imports and FAILS on a module missing from SOURCES.

     v15.8.0 — Round 27 (Chicago). ⚠️⚠️ §0.-14 IS THE WRITE-UP AND THE SUITE WAS
     RED IN THE REPO AS DELIVERED — two harnesses, of 43. FIVE FILES WERE LYING
     ABOUT THEIR OWN VERSION: game.js's constant said 3.38.0 against a 3.42.0
     header, learn.js 2.23.1 against 2.27.0, hud.js 1.2.0 across a BREAKING
     return-shape change, style.css and adventure.css in their CSS stamps. The
     CODE WAS NEW IN EVERY CASE — only the stamps were stale, and the header was
     the honest half every time. ⚠️⚠️ §0.-14.C IS WHY IT WAS URGENT: ROADMAP tells
     Jake to check the footer for v3.38.1 / v2.23.2 before concluding anything on
     Monday, and a correctly deployed build was going to answer with the PRE-FIX
     numbers — failing in the direction that reads as "a tab on old code" and
     sends you to the update gate. ⚠️ §0.-14.D IS THE PART WORTH READING: the pin
     on hud.js could not fire, because a pin checks a hand-maintained number and
     inherits its honesty — it catches "you forgot the harness", never "you
     forgot to bump the module". Fixed in tests/version-stamp-test.mjs (99
     checks), which puts audit-versions.mjs's check INSIDE `npm test`, because
     a guard outside the suite is a guard nobody runs. ⚠️ IT FAILS ON LYING
     STAMPS ONLY — the 14 header-length budgets print as NOTES on purpose;
     read §0.-14.E before promoting one. hud-test.mjs rewritten for the
     `{ lead, sprint }` API. ⚠️ §0.-14.G is two false positives whose fix was to
     make the check LOOSER. 44 harnesses, all passing. ⚠️ ROADMAP ITEM 0b WAS NOT
     STARTED — see §0.-14.H, which also leaves hud.js's major-bump question open
     as Jake's to make.

     v15.7.0 — Round 26b–f (Elliott-Fisher), same evening, all display work.
     §0.-13 is the write-up. The two-row top bar shipped across all four
     surfaces; ⚠️ `lead` IS ALWAYS THE DAILY FIGURE and §0.-13.A is why that is
     not a style choice. ⚠️ §0.-13.B IS A STRAY `</div>` THIS ROUND SHIPPED into
     learn.html — the Safari-always/Chrome-sometimes signature of a parse-error
     recovery path; run a div-balance check after any markup edit. §0.-13.C: the
     landing page's "extra read" already existed and was being discarded.
     §0.-13.D fixes "not everyone got fireworks" — the suppression asked whether
     the total was past the goal, which stays true all week, instead of whether
     the child had been SHOWN it. ⚠️⚠️ §0.-13.E IS THE DAY'S ACTUAL LESSON: FOUR
     hand-maintained twins failed in one day, and ROADMAP item 9 is no longer
     tidying. §0.-13.F is about mockups and cost a phantom roadmap item.
     New invariants 111 and 112. §0.-13.G is "I'm done" (Round 26g) and ⚠️ ITS
     RULES ARE THE DESIGN — read them before touching that button. 43 harnesses.
     celebrate.js and receipt.js are new. ✅ ROADMAP ITEM 0 IS CLOSED; next is
     item 0b, a settings panel for School, which is also the only place left for
     the class information learn.js v2.24.0 removed from the bar.

     v15.6.0 — Round 26 (Elliott-Fisher). ⚠️⚠️ §0.-12 IS THE WRITE-UP AND IT IS
     A LIVE DATA-CORRUPTION FIX FOUND IN PRODUCTION ON THE EVE OF THE CUTOVER.
     Two students out of two classes showed a 2026-08-21 daily total equal to
     their real work PLUS THE WHOLE OF 2026-08-20 — exact to the second and the
     character for one of them. `mergeGuestStats()` period-guarded the SERVER
     side of `live - base` and never the LIVE side, and on the only path that
     calls it the server guard is a TAUTOLOGY because the caller synthesises
     `lastDate: dateStr`. learn.js's caller writes the tautology down as a
     guarantee. A tab left open overnight re-authed with yesterday's counters in
     `live`, and the function's own last line then restamped them as today's, so
     the tick's midnight rollover never fired. ⚠️ THE CHILD REPORTED THE
     FINGERPRINT HIMSELF — the HUD "started in the teens" before he typed.
     Fixed in BOTH files (game.js v3.38.1, learn.js v2.23.2) with `liveDay` /
     `liveWeek`, which gate the contribution AND THE FLOOR — §0.-12.C is about
     why zeroing the contribution alone is a half-fix. tests/live-period-test.mjs
     fails 42 against the old build and passes 63 against the new; its Part B
     passes on BOTH and exists to prove Round 23's guest minute is not un-fixed.
     ⚠️ §0.-12.E IS THE RESIDUE LIST — three things this does NOT fix, one of
     which (the day rollover living only in the tick) is the structural version
     of the same defect. ⚠️ §0.-12.F IS A SECOND, UNDIAGNOSED FINDING: one
     student's 2026-08-17 reads 0m 0s / 0 chars against real typing. NOT chased,
     NOT theorised about. 40 harnesses.

     v15.5.0 — Round 25 (Hall). ⚠️ §0.-11 IS THE WRITE-UP. A ONE-LINE STAFF READ
     PATH FIX, SHIPPED THE DAY BEFORE THE CUTOVER BECAUSE THAT IS THE LAST DAY IT
     IS WORTH ANYTHING. `lessons-admin.js` dated every typing_logs document by
     the `date` FIELD inside it, where reports.html warns in capitals to key off
     the document ID. Cosmetic before the cutover; from 2026-08-22 it also picks
     the READ BRANCH, and a post-cutover document read under a pre-cutover date
     goes legacy-first and drops that day's per-source afternoon. ROADMAP item 9
     had this as "not urgent" — an assessment that was correct when the cutover
     was in the future and expired at midnight tonight. ⚠️ THE ROUND ALSO AUDITED
     THE WHOLE CUTOVER AND FOUND IT SOUND — §0.-11.C lists what was checked and
     what came back clean, so the next round does not re-audit it. ⚠️ THE FONT PICKER WAS ASKED FOR AND DEFERRED
     ONE WEEKEND, ON TIMING NOT SCOPE — §0.-11.D, WHICH ALSO HOLDS THE TWO
     PIDDLY FIXES THAT DID SHIP. ⚠️ AND ROUND 24 LEFT NO CHANGELOG ENTRY — §0.-11.H.
     ⚠️⚠️ §0.-11.E IS THE SCHOOL-LINK DIAGNOSIS (mechanism certain, cause NOT —
     school-audit.html answers it read-only), §0.-11.F IS THE DRILL FILTER AND THE FONT PICKER, BOTH
     SHIPPED INTO learn.js v2.23.0 ON JAKE'S CALL — whole-group matching on his
     ruling, and a proportional font turned out to break a no-reflow guarantee
     style.css did not know it was making, §0.-11.G CONFIRMS THE CSV ROLLOVER EXISTS. 39 harnesses. 38/38 harnesses, 53 checks in
     daylog-cutover-test.mjs.

     ⚠️ ROUNDS 23 AND 24 SUMMARISED HERE UNTIL NOW; their write-ups are
     §0.-9 and §0.-10 in this file and are unchanged. -->

**Round 41 — Rem-Sho.** ⚠️ **ROUNDS 36–40 ARE ALL WRITTEN UP AS UNDERWOOD, AND UNDERWOOD IS ROUND 1** — the fourth occurrence, past three written warnings including §0.-20.J, which is the write-up of the third. Left as recorded rather than renamed: a roster is data and rewriting history in it would be worse than an honest duplicate. **Grep the roster before you write a name anywhere.**

> *On the name:* the **Rem-Sho** was built by the Remington-Sholes company, and the name was the product. It evoked Remington — the machine everyone trusted — and Sholes, the man who invented the thing, and a buyer reading the front of it drew a lineage the mechanism did not have. That is this round exactly. A synthetic random-letter drill was filed under a lesson's id, labelled "run 1", and graded as that lesson's work; nothing on the record disagreed, because the label *was* the provenance. ⚠️ And the fix is the same shape as the lesson: stamp the record with what it actually is, because a reader a fortnight later has nothing else to go on. The archive written before today has no stamp, and that is exactly why it cannot be fully trusted now.

**Rounds 31–34 — Fitch.** ⚠️ **ONE INSTANCE, ONE CONVERSATION, ONE NAME.** I took
a fresh name each round — four names for four rounds — and Jake caught it: the
convention is one name per INSTANCE, and a roster listing four is a roster
claiming four predecessors that never existed. Consolidated. Predecessors: Postal (30) · Odell (29) · Daugherty (28) · Chicago (27) · Elliott-Fisher (26) · Hall (25) · Monotype (24) · Empire (23) · Smith Premier (22) · Hammond II (21) · Corona (20) · Hermes (19) ·
Salter (18) · Linotype (17) · Royal (16) · Densmore (15) ·
Sholes (14) · Ludlow (13) · Caligraph (12) · Bar-Lock (11) · Williams (10) ·
Remington (9) · Yost (8) · Hammond (7) · Noiseless (6) · Mignon (5) · Oliver (4) ·
Blick (3) · Dvorak (2) · Underwood (1).

⚠️ **Linotype IS ROUND 17 AND MONOTYPE IS NOT IT.** They are different machines
by different companies and both are now on the list; a future round reading the
list quickly will see two similar words and must not conclude one is a typo for
the other. **Check the list, and read the whole word.**

⚠️⚠️ **I CALLED THIS ROUND UNDERWOOD, WROTE IT INTO SIX FILES AND A MESSAGE TO
JAKE, AND CAUGHT IT ONLY WHEN UPDATING THIS ROSTER.** Underwood is **Round 1**.
⚠️ **THAT IS THE THIRD TIME**, and the two notes warning about it are directly
below — Monotype (24) *"very nearly called this round Underwood"*, and Salter
(18) on the same near-miss. **I had read both warnings** while writing §0.-20's
neighbours. Reading a warning about a mistake is not the same as performing the
check the warning describes; the warnings are prose and the roster is data.
**Grep the roster for your candidate before you write it anywhere.** This is the
same shape as §0.-19.C — a doc that names a thing, and a check nobody runs
against it.

> *On the name:* the **Chicago** (1898) printed from a **removable type sleeve** —
> a cylinder carrying the whole character set, which you could pull out and swap
> for another. Change the sleeve and the machine printed a different face, or a
> different alphabet entirely, **while every key cap on the front stayed exactly
> where it was.** So the label under your finger and the character on the page
> could disagree, and there was nothing on the machine to tell you which one to
> believe. That is this round exactly: `const VERSION = "3.38.0"` and
> `// game.js v3.42.0`, two labels on one file, and the code was neither of the
> things one of them said. ⚠️ The machine also went out under **three different
> names in its life** — it began as the Munson and ended as the Draper — which
> is the same joke told twice, and a fair warning that a name is the cheapest
> part of anything. **Check what the mechanism does, not what the front of it
> says.**

> *On the name:* the **Elliott-Fisher** was a FLAT-BED BOOK TYPEWRITER. The
> carriage travelled over an open bound ledger instead of a sheet of paper, and
> it existed for one job: posting an entry into an account book **that already
> had numbers written on the page.** Its characteristic failure was posting a
> figure onto a line that was already carrying a balance forward. That is this
> round exactly — `typing_logs/{uid}_2026-08-21` received a balance that had
> already been posted to `{uid}_2026-08-20`, and then got stamped with today's
> date so nothing downstream could tell. ⚠️ The machine also lost to the
> loose-leaf ledger and the tabulating card, for the reason bound books lose to
> everything: **you cannot check one page against another without turning
> back.** The fix here is one line of turning back — asking what day the number
> in your hand is about, before adding it to the number on the page.

> *On the name:* the **Hall** (Thomas Hall, 1881) had no keyboard. It was an
> INDEX machine: you moved a pointer across a printed grid to a POSITION and
> pressed, and the letter you got was a function of where the pointer was. There
> was no key cap — no label anywhere on the machine that could disagree with what
> the mechanism actually did, because the address WAS the character. That is this
> round exactly. A `typing_logs` document is addressed as `{uid}_{date}` by every
> writer and every reader in this app, and the roster panel was asking a label
> inside it instead: `data.date`, which a writer has to remember to set correctly
> and which Round 24 caught being set wrongly on a neighbouring collection.
> ⚠️ The Hall also lost, decisively, to machines with keys — an index typewriter
> is slow, and being unable to disagree with yourself is not worth much if you
> cannot type. **This is a one-line fix in a read path, not a principle to go
> apply everywhere.** The stamped `date` field is still what the QUERY above it
> filters on and still has to be, because an id is not indexable.

> *On the name:* the Monotype was **two machines in two rooms**. A keyboard
> operator punched a spool of paper tape; a caster in another room read that
> tape, later, and cast the type from it. The record and the output were
> separate objects, produced at separate times, and they could disagree — and
> when they did, the tape was right and the type was merely not made yet.
> That is this round exactly. Two rounds recorded a sprint as LOST because the
> report did not show it thirty minutes on; pressing the button again showed it
> had simply not been cast yet. ⚠️ And the round's own fix is the other half of
> the same idea: a record must carry the date it was *punched*, in the operator's
> own terms, because the machine that reads it may not run until tomorrow.

⚠️ **I nearly called this round Underwood No. 5 and got as far as writing it into
a harness header.** Underwood is Round 1 and it is in the list above; Salter's
note below is about very nearly making the identical mistake. Reading the warning
is not the same as checking the list. **Check the list.**
*Other projects, do not reuse:* Stedman, Fable, Trilby, Vernier.

> *On the name:* the Empire was built in Canada and sold across Europe as the
> Adler, and its trick was that the typebars did not swing — they slid straight
> forward on rails and struck the platen head-on, in full view of the typist.
> Every other machine of the era hid the work: the letter appeared under a
> carriage you had to lift to read. **Visible writing** was the selling point.
> That is this round twice over. A child's minute was being counted in one mode
> and silently dropped in the other, and it took Jake typing for four minutes
> with a stopwatch to make it visible — no test, no log, no error. And the fix
> is the same shape: a guest's sprints now go somewhere you can see rather than
> being thrown away at the point of capture. ⚠️ It is also the round in which I
> built an elaborate theory about shared Chromebooks, asked Jake to prove it,
> and was told the ruling was already written in the repo I had just read. The
> thing you cannot see is not always the thing that is hidden. Sometimes you
> just did not look.

> *On the previous name:* the Smith Premier had **two full keyboards** — one complete set
> of keys for capitals and a second for lowercase, side by side, because it
> refused to put two characters on one typebar. Every other maker used a shift.
> Smith Premier's answer was: stop sharing the mechanism, and the collision stops
> being something you have to manage. That is this round in one sentence. §3.1
> was never a race that better locking would fix — it was **one field with two
> writers**, where the last one to arrive is correct by definition. game.js and
> learn.js now have their own keys. Nothing arbitrates, because there is nothing
> left to arbitrate. ⚠️ The machine was also enormous, and the shift won in the
> end. Two banks of keys is the *right* answer to exactly one problem and an
> expensive answer to every other one — which is why this is a per-source
> **field**, not the per-source **document** that two rounds designed and the
> deployed rules reject.

> *On the name:* the Corona 3 folded. You unlatched the carriage and the whole
> top of the machine hinged down over the keys, which is how it fitted in a
> haversack and why it went to the Front. Folding is the trick, and folding is
> what this round did: four session documents covering the same stretch of a
> Tuesday morning, laid on top of one another instead of end to end, so the
> minutes they share are counted once. ⚠️ It is also the round that had to fold
> up its own predecessor's conclusion. §0.0 was written at 3am by an instance
> that found something frightening and reported it accurately, and then drew the
> wrong arrow from it. The evidence was sound. Nobody had weighed it.

> *On the name:* Hermes was a Swiss typewriter — the Baby, the 3000, the ones
> war correspondents carried. It is also the messenger, and that is the half
> that earned it. This round wrote no arithmetic. It built the thing that gets
> a message from Jake to ninety Chromebooks: one number in a console, and every
> tab in the building comes and collects the new code. Everything this project
> has ever fixed stayed broken in the classroom for as long as one tab stayed
> open, and no round before this one had a way to say so.

> *On the name:* George Salter & Co. of West Bromwich made typewriters, but that
> was the sideline. What the name meant to anybody who bought one was **spring
> balances and weighing scales** — the thing you put on the counter when the
> number mattered and you needed to be able to show somebody how you got it.
> This round built no typewriter. It built a scale: one pan holds `typing_logs`,
> the other holds `typing_sessions`, and the needle is the Δ column. The repair
> came second, on purpose, and only after the instrument existed to check it
> with. ⚠️ *I very nearly called this round Underwood* — it is Round 1, it is
> right there in the list above, and I wrote the wrong name into a message to
> Jake before catching it. Read the list before you pick.

> *On the previous name:* the Linotype's celebrated trick was not casting a line
> of type — it was the distributor bar putting every brass matrix back in its own
> channel afterwards, which is the only reason the next line could be set at
> speed. That round did no typesetting: it took seventy-nine loose things out of
> the repo root and dropped each one into the channel it belonged in.

---

## §0.-31. ✅ ROUND 41 (Rem-Sho) — A PRACTICE DRILL WAS BEING GRADED AS THE LESSON

**2026-08-25.** Jake asked for ROADMAP 15. Reading item 15's own constraint 2 —
*"the gates are not on the record"* — meant opening `gatesForRun()`, and the line
the spec cites turned out to be reachable from a button no one had traced.

### A. ⚠️⚠️ THE "🎲 PRACTICE MISSED KEYS" DRILL WAS THE LESSON'S RUN 1

`_practiceMissedKeys()` replaces `currentRuns` with a synthetic one-chunk
`key_random` drill and calls `beginStep(0)`. It **deliberately leaves
`currentLesson` alone** — the student is still notionally in the lesson — and
every writer downstream reads that as authority:

* `logRun()` filed a `typing_sessions` sprint carrying the **lesson's id** and
  `detail: "run 1"`, byte-identical in shape to a real run.
* `recordRunOutcome(0, …)` banked mastery points into the real
  `runScores["0"]` and wrote **`runCount: 1`** over a 12-run lesson's count.
* `saveProgress()` marked the **whole lesson `passed`**, bumped `attempts`,
  overwrote `finalWPM`/`finalAccuracy` and could increment `fireCount`.

⚠️ **AND IT WAS THE EASIEST A🔥 IN THE APP.** A synthetic step is `key_random`,
so `gatesForRun()` returns `minWPM: null` — accuracy only — and a clean
83-character run of random letters scored A🔥, passed the lesson and unlocked the
next one via `isUnlocked()`.

⚠️ **THE FIX IS AN ORDER, NOT A GUARD.** `remediationRun` is set **before**
`beginStep()` and branched on **above the `isLastRun` fork** in `finishStep()`.
Both modals write — `showLessonResultModal()` calls `recordRunOutcome()` *and*
`saveProgress()`, `showStepModal()` calls `recordRunOutcome()` — so a guard
inside the first one still grades any drill that chunks into more than one run,
**which is exactly the student with enough missed keys to need one.**
`remediation-test.mjs` B3 asserts the position, not the presence.

### B. ⚠️⚠️ THE MINUTES STILL COUNT. THIS IS NOT ROADMAP 10.

§0.-21.C's ruling for the *practice run* — write nothing anywhere, minutes
included — is right there and **wrong here**, and reusing it would have been the
easy mistake. That run replays material already mastered. This one is a child
typing keys they just got wrong. `saveStats()` and `logRun()` both run **before**
the branch, so the seconds land in `typing_logs` and `typing_sessions` alike;
only the assessment is suppressed. Suppressing one of the two would manufacture
the exact divergence ROADMAP item 4's flag exists to catch.

⚠️ `renderRemediationResult()` **must not say "nothing was recorded"** — that is
ROADMAP 10's wording and it would be false. A child told their four minutes did
not count stops pressing the one button in this app that answers what they
personally got wrong. `remediation-test.mjs` C3 asserts the absence of that
sentence.

### C. ⚠️ WHAT IT COSTS THE ARCHIVE, AND WHY IT HAD TO BE FIRST

Sprints written **before learn.js v2.36.0 carry no `practice` stamp** and cannot
be told from real runs. So the reconstruction in §D may grade a random-letter
drill as lesson material for any day before today. That is unfixable and is why
**nothing the button writes advances a student.**

It is also why this had to be fixed before item 15 rather than alongside it: the
reconstruction reads `typing_sessions` and keys on `runCount`, and this defect
corrupts both — it would have written reconstructed grades derived from polluted
records, permanently, and `runCount: 1` would have made item 15's own staleness
guard misfire on legitimate lessons while staying quiet on the corrupted ones.

### D. ✅ ROADMAP 15 IS BUILT, BOTH HALVES

**Forward:** `runGrades[k]` (best grade per run) and `runFires[k]` (A🔥 count per
run) are written in `recordRunOutcome()`. ⚠️ `runScores` **could not** answer
Jake's question — it is a SUM, so 2 points is one A🔥 or two A's and nothing can
tell them apart afterwards. No new reads and no new writes: both ride the merge
`recordRunOutcome()` already queues.

**Backward:** the `⚑` button beside `⟳` on every daily-log row. Preview → confirm
→ write, in that order, with nothing written before the confirm. Four guarantees,
all enforced in code:

1. It **never overwrites a grade the student earned** — only empty runs are filled.
2. It **never touches `passed`, `fireCount`, `runScores`, `runLocks` or `grade`**.
   Those advance a child through the curriculum. A repair tool that can promote is
   a promotion tool, and a wrong promotion is indistinguishable from real progress
   afterwards — §0.-14.C's failure direction.
3. Every entry is tagged `runGradesFrom[k] = 'sessions'` and the record stamped
   `regradedAt`, so a reconstructed A🔥 is distinguishable from an earned one
   forever, and a future round can find and undo everything this one wrote.
4. It **refuses rather than guesses** when `runCount` has drifted.

### E. ⚠️⚠️ THE RULES FORBADE THE FEATURE, AND THE RULE CHANGE *WAS* THE ROUND

`match /users/{uid}/{collection}/{docId}` allowed `write: if request.auth.uid ==
uid` **with no staff branch at all**. Staff could read a student's
`lessonProgress` and never write it — so the button would have failed
permission-denied for every student except Jake's own account, **the one account
that never needed it.**

✅ **Rules v2.7.0 ships in this round, not after it.** Rule 9's note names the
exact sentence this would have been: *"the rules won't let me remove the old one
yet, so I'll add the new one now and clean up later."*
⚠️ **THE STAFF BRANCH NAMES `lessonProgress` EXPLICITLY** rather than reusing the
four-name whitelist — nothing needs staff writing a student's `profile`,
`progress` or `stats`, and a wildcard would have handed every teacher all four.
⚠️ **IT WAS EXECUTED, NOT REASONED ABOUT.** `npm run test:rules` now runs 61
cases, 7 of them new, including four negatives proving the branch is
`lessonProgress`-only. §0.-5.A is about the round that skipped those nine seconds.

### F. ⚠️ RULE 9 — `run-grade.js`, AND WHY IT IS NOT A TWIN

Grading a stored sprint needs `lesson × run index → run type → gates`, and run
index indexes the **chunked** list — a 2-step lesson can be 12 runs. Reproducing
that in `reports.html` would be the twin failure of §0.-13.E, §0.-18 and §0.-19.

`run-grade.js` v1.0.0 is the one copy. learn.js's `calculateGrade`,
`gatesForRun`, `chunkSequence`, `DRILL_TYPES`, `FIRE_GRADE`,
`REACH_HOME_COMPANION` and **three separate local `GRADE_ORDER` arrays** (two
written as literal `A🔥`, one built from the code point — three spellings of one
ordering, in one file) are **deleted in the same deploy**.

⚠️ **ONE PLACE A TWIN COULD STILL FORM, AND PART D IS THE RATCHET.** `runPlan()`
must chunk a sequence, and two step types generate their characters at random.
But their **length and space positions are fixed** by `(groupSize, groupCount)`,
so chunk boundaries are fully determined without generating a letter — the plan
computes **shape, never content**. `run-grade-test.mjs` D2 drives learn.js's
**real** generators, extracted from the shipped source, and asserts both agree on
run count across 11 step shapes. **If D2 goes red, `reports.html` is mapping run
indices onto the wrong steps and every grade it writes is against the wrong
gates.**

### G. ⚠️ A HAZARD ITEM 15 DID NOT LIST

`logRun()` appends `(interrupted)`, `(left page)` or `(hidden)` to a **fragment's**
`detail`. Keying a run on the raw string files one run's fragments as three
separate runs and grades each on its own partial numbers — which is precisely how
the 0 WPM rows in Jake's screenshot would have become real, stored grades.
`runIndexFromDetail()` strips the parenthetical; `mergeContinuations()` sums the
union and recomputes WPM with `logRun()`'s own arithmetic.

### H. ⚠️⚠️ I TRUNCATED A FILE TO ZERO BYTES. §0.-24, VERBATIM, HAVING READ IT.

`io.open(p, 'w')` truncates on open; the encode then threw `UnicodeEncodeError`
on a surrogate escape and `tests/run-all-tests.mjs` was left at **0 bytes**. This
is §0.-24's heredoc failure exactly, and **I had read that warning earlier in the
same session** while surveying this file.

⚠️ **THE RULE IS: ENCODE FIRST, WRITE TO A TEMP FILE, VERIFY THE SIZE, RENAME.**
No file may be opened for writing until the bytes are known-good. Reading a
warning about a mistake is not performing the check the warning describes —
§0.-20.J's lesson, one layer down, and now the second thing in this file that has
been learned twice. Restored from Jake's upload.

⚠️ **AND TWO ASSERTIONS WENT RED AGAINST THE CORRECT BUILD** because they matched
**this round's own comments** — I had written `isLastRun` and `beginStep()` in
prose above the lines that use them. Position checks now run on `decomment(src)`.
**A harness that reads comments can be satisfied by writing a comment.**

### I. ⚠️ AND THE ROSTER WAS WRONG AGAIN

Rounds 36–40 are all written up as **Underwood**, which is **Round 1**. §0.-20.J
is the write-up of that mistake being made for the third time, past two warnings.
It was then made a fourth time and stuck. **This round grepped the roster before
writing the name anywhere**, which is the check §0.-20.J asks for and is the only
thing that works. Rem-Sho is free.

### K. ⭐ §10.H IS BUILT, AND IT WAS NEVER A FEATURE

Jake asked for the lesson measurement **before** item 10's gate was designed. It
went unbuilt for five rounds and four handoffs said so. The reason it kept
slipping is that it read as new work; it is not.

`scanForStuck()` in `lessons-admin.js` **already reads exactly the records it
needs** — one `lessonProgress` subcollection per filtered student, ~25 for a
class, ~300 for the school. The aggregate rides that same sweep. **Zero extra
reads.** A second button would have re-read all ~300 documents to answer a
neighbouring question about the same data.

⚠️⚠️ **TWO COLUMNS, BECAUSE ONE IS ACTIVELY MISLEADING.** Runs-per-student high
with a **high** pass rate is the strong ones coasting; the same number with a
**low** pass rate is the struggling ones grinding. Opposite problems, opposite
fixes. **The original spec asked for a single "attempts" column**, which cannot
tell them apart — and confusing them is how a farming gate ends up punishing the
student it was built to help.

⚠️ **IT SUMS `runAttempts`, NOT `attempts`.** `attempts` counts lesson
*completions*; a student grinding run 2 of 12 has `attempts: 0` and is precisely
who this is looking for (§0.-13's "not started" student).
⚠️ **AND IT IS COUNTED BEFORE THE `passed` EARLY RETURN** in the stuck loop —
returning first would have counted only students still stuck, which is the
opposite population from the one the farming question is about.

### L. ⚠️ TWO ⭐⭐ ROADMAP ITEMS WERE STALE, AND THAT IS AN EXPENSIVE FAILURE

**Item 13** carried ⭐⭐ for eight rounds on one unresolved line — *"a dozen
attempts, four runs recorded; check before building item 14 on this field."*
**That was ROADMAP 14b and Round 31 fixed it.** `{0:1, 1:2}` out of a dozen is the
exact fingerprint §0.-23.C predicts. The item's own body had said "RESOLVED BY
JAKE'S CONSOLE READ" since Round 30; **the heading never caught up.**

**Item 11a** carried ⭐⭐ with both of its bugs fixed in Round 33. What is actually
left is a **ruling for Jake** — `typing_logs` stamps class/school at write time,
so assignment does not fix old reports, and the UI implies otherwise. Recorded as
a decision with both options stated, not as a bug.

⚠️ **THIS IS EXACTLY WHAT COST ROUND 35 A WHOLE ROUND** (item 17's stale premise:
*"a round that 'fixed' it would have changed nothing and reported a saving"*).
**WHEN A CONSOLE READ OR A LATER ROUND SETTLES AN ITEM, CHANGE THE HEADING IN THE
SAME EDIT.** A ⭐⭐ that is already fixed is worse than no flag: it spends the next
instance's attention on the highest-priority thing in the file.

### M. ⚠️⚠️ NOTHING WAS WATCHING `firestore.rules`, AND JAKE FOUND IT BY READING

I bumped the rules file's title line to v2.7.0 and **left its version-note stack
ending at v2.6.0** — the file claimed a version its own history did not mention.
`npm test` and `npm run audit:versions` both reported **clean**, because
`firestore.rules` appears in **none of the three source lists**: not
`versions.js` SOURCES, not `tools/audit-versions.mjs`, not
`version-stamp-test.mjs`.

⚠️ **THIS IS §0.-30.F ONE FILE OVER.** That round found `admin.js` invisible to
the drift detector and called it backwards for the file that writes every book in
the library. This is the file that is **the security boundary of the whole app**,
that Jake **cannot test from a browser**, and that he **pastes by hand** — and it
was the least-watched file in the repo.

✅ **`version-stamp-test.mjs` v1.2.0 Section F now watches it.** Mutation-verified:
F4 and F6 both go red against the file exactly as I shipped it an hour earlier.

⚠️⚠️ **IT IS DELIBERATELY *NOT* ADDED TO `versions.js` SOURCES, AND THE REASON
MATTERS MORE THAN THE CHECK.** That instrument fetches files **as deployed** and
compares them. The rules that actually run live in the **Firebase console**, not
on GitHub Pages. A SOURCES entry would faithfully report the repo's copy while
*implying* it had checked the live ones — a green light on the one file whose
deployed state nothing in this repo can see. **That is §0.-22 exactly: a
diagnostic is consulted INSTEAD of checking, so when it is wrong nothing
disagrees with it.** The honest check is internal consistency, and that is all
Section F claims.

⚠️ **F6 IS SMALLER AND WORTH KEEPING.** My match-site comment used bare `⚠`
without the variation selector, so three warnings in the security-boundary file
rendered as a dingbat rather than a warning sign — quietly less visible than
every other warning around them. Fixed, and now asserted.

⚠️ **THE GENERAL LESSON: A VERSION BUMP IS NOT A NUMBER, IT IS A NOTE.** The
number tells you *that* something changed; the note is the only thing that tells
the next instance *what*. I wrote 400 lines of handoff about this round and
skipped the four lines that belong in the file a future round will actually open.

### N. ⚠️⚠️ THE RECONSTRUCTION WROTE A WRONG GRADE ONTO A REAL STUDENT

**Jake ran the ⚑ button on 2026-08-24 and saved the output as accurate.** It was
not. `u1_l5 run 1 → D (15 fragments merged)`; the true answer is **B**. The child
typed about five real attempts, not fifteen fragments, and never earned a D.

⚠️ **THE STUDENT WAS NEVER AFFECTED, AND THAT IS THE ONLY REASON THIS IS
RECOVERABLE.** `runGrades` feeds nothing: not `passed`, not `fireCount`, not
`runScores`, not the lesson grade. Nothing unlocked, nothing locked, and no
screen a student sees changed. **Guarantee 2 in §0.-31.D is what turned a wrong
write into a wrong display**, and guarantee 3 — `runGradesFrom: 'sessions'` — is
what makes it findable and fixable. Those two constraints earned their keep
within a day of shipping.

**THREE FAULTS IN `mergeContinuations()`, AND THEY COMPOUND:**

1. ⚠️⚠️ **RETRIES ARE NOT FRAGMENTS.** A student who fails run 1 and types it
   again writes a second sprint with the *identical* detail, `"run 1"`. Jake's
   morning holds run 1 at 8:47 (90%), 8:49 (87%) and 8:50 (94%) — three honest
   attempts, folded into one imaginary run. **Only `continuation: true` marks a
   fragment.**
2. ⚠️ **AN ABANDONED TAIL POISONS THE UNION.** The 9:13 sprint — 23s, 28 chars,
   32% — averaged into three good attempts drags the union under the 85% gate.
   **That is where the D came from.**
3. ⚠️⚠️ **OVERLAPPING ROLLUPS DOUBLE-COUNT AND `sessionSignature()` CANNOT SEE
   IT.** The day holds an 8:47 rollup of 5 sprints *and* an 8:47 rollup of 7 that
   **contains the same five**. daylog.js keys on the whole sprint timestamp LIST,
   so a superset has a different signature and is correctly not a document-level
   duplicate. **The duplication is per SPRINT and must be removed per SPRINT.**
   21 raw sprints → 13 real attempts.

⚠️⚠️ **THE ROADMAP'S OWN CONSTRAINT 1 IS WRONG IN BOTH DIRECTIONS AND I FOLLOWED
IT.** *"Group by (date, label, detail) and grade the union"* **merges retries**
(identical detail) and **separates real fragments** (whose detail carries
`"(left page)"`). I noticed the second half, fixed it by stripping the
parenthetical, and inherited the first half without ever asking whether two
sprints with the same detail were the same run. **A constraint written down by an
earlier round is a hypothesis, not a specification** — the third time this file
records that lesson (§0.-21.B, §0.-23.A).

✅ **`mergeRunAttempts()` REPLACES IT.** An attempt opens on a non-continuation
sprint and absorbs the continuations that follow it; sprints are deduped on their
ISO instant; a continuation with no start is an **orphan** and is refused, never
graded. Best grade across attempts is what a run is worth.

✅ **AND THE BUTTON IS SELF-HEALING NOW, WHICH IS THE PART THAT MATTERS.** It
**recomputes** entries tagged `runGradesFrom: 'sessions'` and still never touches
an earned one. ⚠️ **A SKIP-IF-PRESENT RULE WOULD HAVE FROZEN THE BAD DATA
FOREVER** — the first version had exactly that rule, and it was one line from
being unrepairable. `runFires` is **assigned, not incremented**, so a recompute
converges however many times it runs.

⚠️ **AND THE GRADES WERE INVISIBLE.** Round 41 shipped the field, the writer and
the reconstruction, and gave the teacher **nowhere to read any of it** — when the
item's whole purpose was *"where I could have counted the number of flaming
A's."* `showGrades()` (the `◈` beside each student) renders lesson × run, and
**draws reconstructed pips dimmed and underdotted** so a teacher can always tell
a derived fireball from an earned one.

### O. ⚠️⚠️ NEW, NOT FIXED — `⟳` OVER-COUNTS A DAY WITH OVERLAPPING ROLLUPS

Found while diagnosing §N and **not chased**, per the rule about not speculating
past two files. Jake's 2026-08-24 rollups sum to **~30m 30s** of session time
against a stored day of **21m 40s**, because two pairs of rollups overlap.
`recalcDailyLog()` sums whole rollups through `splitSessionTotals()`, deduping
with `sessionSignature()` — **which cannot see a superset.**

⚠️ **AND THE DROP GUARD ONLY GUARDS DOWNWARDS.** `DROP_GUARD_RATIO` asks the
teacher to confirm a *reduction*; an inflation of nine minutes applies silently.
**So pressing `⟳` on that day would raise a real student's graded minutes by ~40%
with no prompt.** ROADMAP item 24. **Do not press `⟳` on a day whose drill-down
shows two rollups at the same minute until it is fixed.**

### J. THE NUMBERS

`learn.js` v2.36.0, `run-grade.js` v1.0.0 (NEW), `reports.html` v1.1.0 / inline
v2.29.0, `versions.js` v1.15.0, `firestore.rules` v2.7.0,
`lessons-admin.js` v1.15.0, `admin.html` v1.1.0, `run-all-tests.mjs` v1.16.0.
**54 harnesses pass** (52 before), plus **61 rules cases** under the emulator.
`remediation-test.mjs` is mutation-verified: **27 passing on the fix, 17 failing
against v2.35.0.** `npm run audit:versions` reports **0 problems** — it reported
**1** in the repo as delivered (`versions.js`'s v1.14.0 entry was filed between
v1.8.0 and v1.7.0).

## §0.-30. ✅ ROUND 40 — WHERE 501 CAME FROM, AND THE LEDGER THAT WAS NEVER SEEDED

**2026-08-24.** Jake ran the instrumented report and the console answered a
question three rounds of arithmetic had got wrong.

### A. ⚠️⚠️ THE ROSTER QUERY READS EVERY USER DOCUMENT IN THE DATABASE

```
users                167 reads   1 call     reports.html:1103
typing_logs          104 reads   1 call     reports.html:1181
typing_logs/*        501 reads   397 misses reports.html:1122
```

**501 = 167 × 3 days. 1,169 was 167 × 7.** Same roster both times; only the day
count moved. And 167 is not "students" — `readRosterUids()` runs
`query(usersRef)` with **NO FILTER** on the `isSuper()` + "All schools" path.
Jake has ~101 students; the other ~66 are staff, old accounts and test users.

⚠️ **THE `students × days` LINE ON SCREEN WAS THE CROSS PRODUCT** — what the
sweep WOULD read before anything pruned it — and it was the only cost figure the
page showed. It misled both of us for two rounds. It now reports what was
actually read, of how many were possible, and why the rest were skipped.

### B. ✅ WHAT THE REPORT ACTUALLY COSTS, AND WHAT IT NEVER DID

⚠️ **NOTHING HISTORICAL WAS EVER LOADED.** Jake's model was "1,155 documents from
last week that have no impact on this week", and the complaint was right while the
mechanism was not: the discovery query returned **104 documents**, correctly
date-filtered, cheap. The 501 were blind guesses at document ids, **397 of which
came back empty**. The cost was never old records. It was absence.

### C. ⚠️ THE FUTURE-DATE CLAMP: BUILT, THEN REVERTED, AND BOTH WERE RIGHT

A Saturday-to-Friday grading week pulled on a Monday really does sweep days that
cannot hold data — 167 × 4 = 668 reads of a week that had not happened. That part
was true and Jake accepted it.

⚠️ **BUT I ALSO CLAIMED IT EXPLAINED HIS SPEEDUP, AND IT DID NOT.** He had
narrowed the dates to 8/22–8/24 himself; every one of those falls inside the
clamp, so the clamp did nothing in the run I was pointing at. **Reverted.**
`planReads()` already skips a day it knows is empty, and a future day is the
easiest case of that — a second mechanism doing one job means two places to check
when a number looks wrong, and only one of them is tested.
⚠️ **JAKE'S SATURDAY-TO-FRIDAY DEFAULT MUST NOT CHANGE.** ROADMAP item 21 records
the three-line restore if ledger seeding ever fails to deliver.

### D. ✅✅ ensureSince() — THE LEDGER WAS NEVER GOING TO REACH MOST STUDENTS

⚠️ **`noteDay()` ONLY FIRES ON A TYPING FLUSH.** A student who signs in and does
nothing therefore has no ledger; `ledgerFrom()` correctly returns `null`, and
reports.html correctly sweeps every day of every range for them — **forever**,
because they never type and so never get a ledger. That is most of the ~66 extra
accounts, and it is why the ledger looked useless in production.

✅ `ensureSince()` seeds `ttbLogDaysSince` on first sign-in, from the user
document `noteActiveDay()` (game.js) and `loadGateState()` (learn.js) **already
read**. No extra read. ⚠️ **ONE WRITE PER STUDENT, EVER** — `since` is set once
and only ever moves backward.

⚠️ **IT REFUSES TO WRITE WITHOUT THE CALLER'S `userData`, AND THAT GUARD IS THE
POINT.** Writing `since` blind could replace an EARLIER value with a later one,
which silently reclassifies days we DO know about into "skip" — the one direction
this module must never move. `logdays-test.mjs` E6.

### E. ⚠️⚠️ AND WRITING THAT TEST FOUND A BUG THAT WOULD HAVE MADE IT POINTLESS

`ledgerFrom()` read `since` **inside** the `Array.isArray(days)` branch. So a
document with a `since` and no day array returned `null` — "I know nothing" — and
was swept in full. **That is exactly the document `ensureSince()` creates.** The
seeding would have shipped, written 167 fields, and saved nothing.

⚠️ **THE TWO FIELDS ANSWER DIFFERENT QUESTIONS AND MUST BE READ SEPARATELY:**
`since` is "from when have I been watching?", `days` is "and what did I see?".
**An empty answer to the second is a real answer, not a missing one.** logdays.js
v1.2.0. Caught by a case written for `ensureSince`, not by one written for
`ledgerFrom` — the harness for the new thing found the bug in the old thing.

### F. ✅ ROADMAP 16 — THE BUILD PANEL ON BOTH STAFF PAGES

`reports.html` and `admin.html` had a version stamp and no build list, and
**neither was in `versions.js` SOURCES** — so a stale `admin.js`, the file that
writes every book in the library, was invisible to the one instrument built to
find stale files.

Both shells now carry an HTML version comment parsed by SOURCES, both footers have
the button. ⚠️ **THE SHELLS ARE IN `HEADER_EXEMPT`** in `version-stamp-test.mjs`:
section A compares a runtime constant against a `//` header and a markup shell has
neither. **Exempt there means "no constant to disagree with", NOT "stop watching
it"** — they are still parsed and still drift-checked.

⚠️ `admin.js` wrote `footerEl.innerText`, which would have **deleted the new
button half a second after load** — a bug that reads as "the button never worked"
rather than as "the button was erased". It writes a span inside the footer now.

### G. ⚠️⚠️ I DELETED A HEADER ENTRY WITHOUT ARCHIVING IT. AGAIN.

Archiving `admin.js`'s oldest entry to stay inside the 8-entry budget, my script
wrote `admin.js` **before** a later assertion failed — so the entry was removed
and never filed, leaving an orphan line glued to the previous entry. **This is
§0.-26.C's failure, repeated by a different route.** Restored from Jake's upload
and redone.

⚠️ **THE FIX IS AN ORDERING RULE: VALIDATE EVERY FILE, THEN WRITE EVERY FILE.**
No write may precede any assertion. It then caught three more of my own mistakes
harmlessly in the same round — a too-strict substring check, an assertion my own
explanatory comment tripped, and a line-count assertion that failed on a
legitimately one-line entry (`versions.js` v1.6.0).

⚠️ **AND ASSERT ON THE BOUNDARY, NOT ON A SHAPE YOU EXPECT.** "This entry has at
least two lines" was a guess about the data. "The line after the entry is not a
continuation" is the property that actually matters.

⚠️ **FOUR LIVE CODE COMMENTS IN `admin.js` CITE "v3.25.3"** as their explanation,
which makes the "moved to CHANGELOG" note in its header load-bearing rather than
decorative. Check for citations before archiving an entry.

## §0.-29. ✅ ROUND 38 — CONTINUE READING, AND THE FAILURES THAT WERE NEVER THERE

**2026-08-24.** ROADMAP item 19 built for zero extra reads. ⚠️ **AND THE SUITE
HAS BEEN LYING FOR AT LEAST THREE ROUNDS, IN MY FAVOUR.**

### A. ⚠️⚠️ THE "8 PRE-EXISTING FAILURES" WERE AN UNINSTALLED npm

Rounds 36 and 37 both reported "8 failing, none of them mine" and moved on. The
eight were `undefined-calls`, `card-markup`, `credits`, `credit`, `about`,
`about-render`, `metadata-map` and `drill-filter` — and every one of them died on
`ERR_MODULE_NOT_FOUND` for **`jsdom` or `acorn`**.

⚠️ **BOTH WERE ALREADY DECLARED IN package.json.** Nothing was wrong with the
repo. The container had never run `npm install`. `npm install jsdom acorn` →
**ALL 51 HARNESSES PASS**, and did so before this round changed anything.

⚠️ **THE COST WAS NOT THE FALSE NUMBER, IT WAS THE FALSE ASSURANCE.** "None of
them are mine" sounded like the changes had been checked against those eight. They
had not been *run at all* — including `card-markup-test.mjs`, which exists
specifically to catch invalid card markup, and `undefined-calls-test.mjs`, which
resolves every identifier in every shipped file. Two rounds of index.html and
game.js edits went out without either.

⚠️ **THIS IS THE SAME SHAPE AS THE ROUND 7/8 ARGUMENT** recorded in
package.json's own `//devDependencies` note: Round 8 read a working test run as
proof of a declaration nobody opened the file to check. This is that error with
the signs reversed — a failing test run read as proof of a repo problem nobody
checked either. ⚠️ **RUN `npm install` BEFORE READING A FAILURE COUNT, AND SAY
WHICH PACKAGES WERE MISSING IF ANY WERE.**

### B. ✅ CONTINUE READING — index.html v3.14.0, ZERO NEW READS

A row of the three books the student most recently typed in, above the shelf.

✅ Every field already exists. `loadUserProgress()` fetches
`users/{uid}/progress` and caches it for eight hours, and **game.js has stamped
`lastUpdated` on every progress write for a long time — this is the first
consumer.** No new query, no schema change, no writer change.

⚠️ **RANKS ON LAST-TOUCHED, NOT PERCENT COMPLETE.** A book abandoned at 80% is
not what a student wants resumed; the one opened this morning at 4% is.

⚠️⚠️ **`lastUpdated` ARRIVES IN FOUR SHAPES AND THE CACHED ONE IS THE ONE THAT
RUNS ALL DAY.** A cold read gives a Firestore Timestamp with `.toDate()`. The
localStorage round-trip strips the methods and leaves a plain
`{ seconds, nanoseconds }`. Handling only the Timestamp would rank every card 0
for almost the entire school day — **the row would still render, in a stable but
meaningless order**, which is the kind of wrong that never gets reported because
it just looks like a feature that is not very clever. `progressTimeMs()` handles
Timestamp, `{seconds}`, ISO string, epoch number and `Date`, and returns 0 rather
than throwing on anything else — it runs inside `renderBooks()`, so a throw takes
down the whole shelf, not just the row.

⚠️ **THE ROW SITS OUTSIDE `#book-grid` ON PURPOSE.** The genre, age and sort
controls must not filter it: "your books" vanishing when a child taps a genre
pill reads as a bug, not as a filter.

⚠️ **renderContinue() IS CALLED FROM renderBooks(), NOT FROM ONE CALLER.**
renderBooks() runs from eight places — cold load, warm cache, stale cache,
sign-in, sign-out, sort, filter, age-clear. Hanging the row off any one of them
leaves the other seven stale, **including sign-out, where it would show one
child's books to the next**.

⚠️ **A BOOK THAT HAS LEFT THE LIBRARY FALLS OUT SILENTLY.** Progress documents
outlive the books they point at; the shelf is the authority on what exists.
⚠️ **NO CHAPTER LABEL ON THESE CARDS, DELIBERATELY** — part-numbered ids like
`2.09` need the chapter LIST to turn into an ordinal, and that list is stripped
before caching. renderBooks() carries the long comment about the two bugs that
came of doing arithmetic on those labels.

`tests/continue-reading-test.mjs`, 14 cases. **52 harnesses, all passing.**

## §0.-28. ✅ ROUNDS 36–37 — THE READ BUDGET, MEASURED PROPERLY AND THEN FIXED

**2026-08-24. 80 reads → 12 on a sprint session; 8 → 3 on the library page.**
Item 17 is closed, and so is the wider read-budget question §0.-27 could not
answer. ⚠️ **THE FIRST HALF OF THIS SECTION IS ABOUT INSTRUMENTS, AND IT IS THE
PART THAT SAVES THE NEXT ROUND A DAY.** Three consoles disagree by 18x and only
one of them is watching this application.

### A. ⚠️⚠️ FIRESTORE QUERY INSIGHTS CANNOT SEE THIS APP

Every top query it reported read `COLLECTION /x SELECT _none_ PageSize 300` — no
`WHERE` clause, uniform page size, and one row listing collection *names*. **No
TTB query has that shape**; every app query filters on `classId`, `uid` or
`date`, and none sets a page size. It is profiling the **Firebase console data
browser** — i.e. whoever is clicking around in it.

It showed ~7,500 reads for a week in which Cloud Monitoring counted ~138,600.
⚠️ **IT IS NOT SAMPLING.** The cause is `experimentalForceLongPolling: true` in
`firebase-config.js` (kept deliberately — Round 4, Safari sign-in): the Web SDK's
traffic goes over the Listen WebChannel, which Query Insights does not
instrument. The `Fetch API cannot load .../Listen/channel` console errors are
that same transport being torn down on navigation. **Benign. Do not chase them.**

⚠️ **DO NOT TUNE ANYTHING ON QUERY INSIGHTS.**

### B. ⚠️ THE FIREBASE "BILLABLE METRICS" PERCENTAGE IS A MONTHLY TOTAL AGAINST A DAILY QUOTA

11% "for the month" was **46K on Aug 21 against a 50,000/day free allowance** —
92% of one day's ceiling. ⚠️ It also **includes Firebase console usage**, so
after-hours development lands in the same number as the students. Measured: one
evening session of Jake's cost 13,200 reads; the Saturday with nobody at all
cost 1,043. **Roughly 38% of the worst day was Jake, before school started.**

✅ Cloud Monitoring `document/read_ops_count` grouped by `type` is the honest
one. ⚠️ Set the alignment function to **Sum** or the axis reads `/s` and a 46,000
peak displays as `0.07`. ⚠️ `NOT_FOUND` is near-zero and is **not** where
missing-document reads land — they bill as `LOOKUP`.

### C. ✅ read-meter.js — THE ONLY INSTRUMENT THAT ANSWERS "WHICH LINE"

A transparent shim: `game.js`, `learn.js`, `index.html` and `update-gate.js`
import the Firestore SDK **through** it, one changed URL each.

⚠️ **`export *` FIRST, THEN THE LOCAL OVERRIDES, AND THE ORDER IS LOAD-BEARING.**
A local export shadows a star export of the same name, so every SDK symbol stays
available even though the file names a dozen. That is the whole safety argument:
the failure mode of a shim like this is a blank page during third period, and
this makes it impossible by construction rather than by careful reading of
import lists. ⚠️ **DO NOT "TIDY" IT INTO AN EXPLICIT EXPORT LIST.**

Console: `ttbMeter.report()`, `ttbMeter.day()`, `copy(ttbMeter.json())`. It
auto-reports 6 seconds after load and again on `pagehide`. **LEAVE IT IN** — it
costs nothing idle and it is the only way to answer this class of question.

⚠️ v1.0.0 INFLATED THE `calls` COLUMN and it looked like a finding: `bump()`
incremented once per FIELD written, so a miss (which writes `reads` and `misses`)
scored two. `7 reads, 6 misses, 13 calls` was 7+6, not 13 calls. Fixed in v1.0.1.
**A diagnostic that over-reports is worse than none.**

### D. ✅ THE MEASUREMENT, AND WHAT IT KILLED

One student, one day, before any fix: **361 reads · 88 misses · 9 writes.**
**24% of every read found nothing.**

⚠️ **TWO HYPOTHESES DIED CHEAPLY AND BOTH DESERVED TO.** (1) That localStorage
caches were cold on shared hardware — killed by one question to Jake: students
use MacBook Airs with individual logins, same machine daily, so the caches
persist. (2) That typing was expensive — 1:30 of typing produced 3 writes and
essentially no reads. **The write budget was never the problem and still isn't.**

### E. ✅ THE INVERTED COUNT GUARD — 55 READS TO RE-READ 55 UNCHANGED BOOKS

⚠️ **THE `getCountFromServer` GUARD ONLY RAN ON A CACHE THAT WAS STILL FRESH,
WHICH IS THE ONE CASE THAT DOES NOT NEED IT.** Past the TTL the cached copy was
discarded **unread** and the whole collection refetched. Measured in one session:
`index.html` spent **1** read validating a fresh cache while `game.js` spent
**55** refetching a stale one, over the same 55 books, minutes apart.

✅ Fixed in both `loadBookList()` (game.js) and `_loadBooksOnce()` (index.html).
The TTL now gates the **check**, not the cache:

    age < TRUST_MS (30 min)  →  serve from cache, 0 reads
    cache exists at all      →  1 read to confirm the count, then serve
    no cache                 →  full fetch, 55 reads

⚠️ **RESTAMP ON SUCCESSFUL VALIDATION** or the 1 read is re-paid on every single
navigation. ⚠️ `idxCacheReadAnyAge()` in index.html exists only for caches that
have a server-side validity check; a cache with no way to test staleness must
keep using `idxCacheRead()` and its TTL.

⚠️ **THE COUNT IS NOT A CHECKSUM, DELIBERATELY.** Editing a title in place leaves
the count unchanged and serves the old one for up to 8 hours. That was already
true and it is the right trade — the alternative is 55 reads per student per load
to catch a typo fix. `window.ttbClearBookList()` after a bulk edit.

### F. ✅ logdays.js — THE LEDGER, AND WHY THE WRITE ORDER IS THE WHOLE ARGUMENT

Every read path discovered activity by **guessing document ids and seeing what
came back**. `readWeek()` asked for seven `typing_logs/{uid}_{date}` to find one
or two; `reports.html` asked for students × days. Firestore bills a `get()` on a
document that does not exist, so both paid full price for absence.

`users/{uid}.ttbLogDays` now records which dates a log actually exists for.

⚠️⚠️ **`noteDay()` IS CALLED BEFORE THE `typing_logs` WRITE, NEVER AFTER, AND
THIS IS NOT NEGOTIABLE.** The costs are not symmetrical:

* a ledger entry with **no log** costs ONE WASTED READ — exactly what every day
  cost before this existed. Harmless.
* a log with **no ledger entry** costs a child minutes they earned, because a
  reader that trusts the ledger skips that day.

**The ledger must be a SUPERSET of the logs.** Write the cheap safe one first and
let it be wrong in the safe direction. ⚠️ **COROLLARY: NOBODY MAY "TIDY UP" THE
LEDGER.** No pruning pass, no reconciliation, no "this day has no log, remove
it". A stale entry is a wasted read; a removed entry is a wrong number.

⚠️ **`ttbLogDaysSince` IS WHY A HALF-MIGRATED DATABASE IS SAFE.** Per date:
`date < since` → unknowable, read blind, exactly as before. `date >= since` →
the ledger is complete, absent means absent, skip it. No flag day, no backfill,
no window in which anything reads short. As the year moves on `since` recedes and
the saving becomes total on its own.

⚠️ **`ledgerFrom()` RETURNS `null`, NOT AN EMPTY LEDGER, WHEN THERE IS NOTHING.**
`null` means "I know nothing" and skips nothing. An empty ledger would read as
"typed on no days" and skip **everything**. Confusing the two empties every
report at once. `logdays-test.mjs` §A2 exists solely to pin this.

⚠️ **`arrayUnion`, NOT read-modify-write.** Two tabs, or Library and School open
at once, must not clobber each other's day. Guarded by an in-memory Set so the
flush path (many times a session) writes the ledger once per day, not once per
flush.

### G. ✅ ITEM 18 — readWeek() PRUNED (daylog.js v1.5.0)

⚠️ **THE WRITER SHIPPED ONE ROUND BEFORE THE READER, ON PURPOSE.** Trusting an
untested field to *skip* a read would have put the one unrecoverable failure — a
child's week total reading short — behind something that had never run in
production. Jake confirmed `ttbLogDays: ["2026-08-24"]` on a real student
document; the reader shipped the next round. **Do this again for anything that
gates a read on a stored field.**

⚠️ **THE LEDGER DEFAULTS TO THIS MACHINE'S localStorage MIRROR AND THAT IS SAFE
BY CONSTRUCTION.** A mirror only vouches for dates from when *that machine*
started recording. A student who typed on a loaner Tuesday and is on their own
MacBook today has a `since` of today, so Tuesday falls before it, is classed
unknowable, and is read blind. **The per-machine `since` handles the
cross-machine case without anyone having to think about it.**

⚠️ **A SKIPPED DAY MUST NOT SET `ok:false`.** It returns `totalsOf(null)` — the
same zeros a genuinely absent document produces. Setting `ok:false` would
suppress the HUD on an ordinary Monday for every student who has typed only
today, which is the `ok` contract inverted. `logdays-test.mjs` §G3.
⚠️ A read that **throws** still sets `ok:false`. §G5.

⚠️ **TODAY IS ALWAYS FETCHED** (`always: [dateStr]`). `readWeek()` keeps today's
RAW document for the per-source seed, not just its folded total, and the student
may be about to type for the first time this session.

⚠️ **A CALLER HOLDING THE `users/{uid}` DOCUMENT SHOULD PASS
`ledgerFrom(userData, uid)`** — it unions the server copy in and saves more. None
of the six call sites do yet.

### H. ✅ THE LEADERBOARD — 60 READS PER SPRINT, AND MY PREDICTION WAS WRONG

Round 36 predicted a second sprint would cost 0. **It cost 60 again.** Two
causes, and only one was a bug:

1. ✅ `leaderboardCache` was a **module variable**, so `LB_CACHE_MS` applied only
   within one page load. Every navigation reset it and the next sprint paid the
   full four-query fetch. Now persisted to `ttb_lbBoard_v1`, **week-keyed** (a
   board restored across a week boundary would show last week's ranking as this
   week's), 30 minutes. ⚠️ **BOTH EXISTING CACHE-BUST SITES NOW CLEAR THE
   PERSISTED COPY TOO** — clearing only the in-memory one means the next page
   load restores exactly what was just busted.
2. ⚠️ **`saveLbThresholds()` RECORDS A CUTOFF OF 0 FOR ANY BOARD WITH FEWER THAN
   TEN ENTRIES, AND THAT IS CORRECT** — there IS room, so the student really
   would place. At the start of a year every student passes `couldPlace()`.
   **THIS IS NOT A BUG AND MUST NOT BE "FIXED" BY FAKING A THRESHOLD**: it would
   silently stop celebrating real placements for the students most likely to
   earn one. See ROADMAP item 20 for the shape of the real fix.

### I. ✅ reports.html — THE SWEEP IS PRUNED PER (STUDENT, DAY)

The roster query already fetches whole user documents, so `ttbLogDays` rides out
of it **for free**. ⚠️ **A SKIPPED PAIR IS NOT AN UNREADABLE ONE** — `unreadable`
drives the "this report may be incomplete" banner, and counting known-empty days
there would cry wolf on every report forever. ⚠️ **THE `MAX_ROSTER_PAIRS` CEILING
IS STILL CHECKED ON THE UNPRUNED CROSS PRODUCT**: pruning can only reduce the
count, so checking the pruned number would let a range through today that stops
working the moment a new student appears.

### J. ⚠️ TWO SELF-INFLICTED WOUNDS, BOTH CAUGHT BY THE SUITE

⚠️ **I SET `DAYLOG_VERSION` TO 1.3.0 WHEN IT WAS ALREADY 1.4.0.** Read the
current value before bumping; do not assume the sequence.

⚠️⚠️ **A TEST CASE NAMED "…a genuine read FAILURE…" FAILED THE WHOLE SUITE WHILE
PASSING ITSELF.** `run-all-tests.mjs` text-matches `/FAIL|UNSAFE|\bERROR\b/` over
everything a harness prints, and "FAILURE" contains "FAIL". Its own header warns
about exactly this. ⚠️ **AND MY GUARD AGAINST IT WAS ALSO WRONG**: I asserted the
substring was absent from the whole FILE, when only what `check()` PRINTS
reaches the matcher — a comment explaining the rule tripped my own assert.
**Assert on the printed strings, not the source text.**

### K. THE NUMBERS

| | before | after |
|---|---|---|
| `index.html` load | 8 | **3** |
| `game.html` load | 19 | **11** |
| `game.html` + one sprint | 80 | **12** |
| `readWeek()` per call | 7 reads / 6 misses | **3 reads / 1 miss** |
| book list, stale cache | 55 | **1** (0 inside 30 min) |
| leaderboard, 2nd sprint | 60 | **0** |
| one report | 1,155 | **~6 + pre-`since` days** |

⚠️ `readWeek()` still runs **twice** on a `game.html` load — the second is
`retroactiveSaveGuestSession()`, which fires whenever there is unflushed guest
time. At 3 reads a call it is no longer worth the risk of deduplicating; at 7 it
was. ⚠️ These figures will drift DOWN on their own as `ttbLogDaysSince` recedes.


## §0.-27. ⚠️⚠️ ROUND 35 (Fitch) — ITEM 17 MEASURED. THE PREMISE WAS STALE.

**2026-08-23. NO CODE SHIPPED THIS ROUND, DELIBERATELY.** ROADMAP item 17 is now
measured, its stated cause is disproved, and the obvious fix is blocked by
`firestore.rules` in a way that would have failed in production on exactly the
students the mechanism exists to protect. **The measurement is the deliverable.**

### A. ✅ THE DATE FILTER WAS ALREADY IN THE QUERY

Item 17 said the window was applied in the browser after the read.
`buildScopedQuery()` spreads
`where("date",">=",start), where("date","<=",end)` into **every** branch and has
for some time. ⚠️ **A ROUND THAT "FIXED" THIS WOULD HAVE CHANGED NOTHING AND
REPORTED A SAVING** — §0.-22's shape again, an item describing a world that had
already moved.

### B. ⚠️⚠️ THE COST IS THE ROSTER SWEEP: `students × days`, UNCONDITIONALLY

Jake measured it: a range in which **three students typed across two days — six
legitimate documents — cost 1,155 reads.** Roughly 99.5% returned nothing.

⚠️ **AND HIS CORRECTION IS THE PART THAT DECIDES THE FIX.** I called them "empty
days." He: *"The days aren't empty — they're just outside of the chosen range.
Those days are chock full of data…for last week."* **The misses are ACTIVE
students whose activity sits elsewhere in time.** There is nothing on a record
marking a day empty, and per-day is the wrong grain: **the question is per
STUDENT — could this one have typed in this range at all?**

### C. ⚠️⚠️ THE OBVIOUS FIX IS ILLEGAL UNDER THE RULES, AND FAILS LOUDLY

One range query per student — `where('uid','==',u)` plus the date range — reads
only documents that exist, bills 1 for an empty result, and never touches
`classId`. **~N reads instead of N × days.** It cannot ship:

`canReadActivity(d)` grants read on `isSuper()`, or building scope with
`d.schoolId in mySchools()`, or `teachesClass(d.classId)`. **Rules are evaluated
per returned document, and a Firestore query fails ENTIRELY if any document it
returns is denied.** A log stamped `classId: ''` / `schoolId: ''` satisfies none
of the three for a non-super caller — **so the query dies on precisely the
documents the sweep exists to catch.**

✅ **THE POINT READS SURVIVE BECAUSE THEY FAIL ONE AT A TIME.** `readLogById()`
returns `{error}` and the report counts `unreadable`. That is why the slow shape
works and the fast one would not, and it is not obvious from either file alone.

### D. THE THREE WAYS FORWARD ARE IN ITEM 17 — AND ONE IS HALF-DONE

Option 2 is cheapest: **Round 33 fixed the WRITERS**, so every log from now on
carries a real `classId` and `schoolId` and therefore PASSES `canReadActivity`.
The per-uid query becomes legal for new data; the sweep stays for the historical
tail. Option 3 (narrow the roster on `activeDayLast` before multiplying) is free
and strong for recent ranges, weak for historical ones — `activeDayLast` is a
high-water mark, not a span.

⚠️ **ONE NUMBER DECIDES BETWEEN THEM AND IT IS NOT MEASURED: what fraction of
logs in a recent range carry a non-empty `classId`.** One console query.
**Measure it before building either.**

### E. ✅ ONE NAME, ONE INSTANCE — A CONVENTION I HAD BEEN BREAKING

Jake: *"you're renaming yourself every round … it should all be one name."* Rounds
31–34 were written up as Fitch, Lambert, Crandall and Molle — **four names for
one instance**, which made the roster claim three predecessors that never existed.
Consolidated to **Fitch** across all documents. ⚠️ **The name is per INSTANCE,
not per round**, however many rounds one conversation covers.

---

## §0.-26. ✅ ROUND 34 (Fitch) — THE GATE WAS TAXING THE STUDENT IT MEANT TO MOVE ALONG

**2026-08-23.** Jake, after Round 32 went live and worked: *"Scoring works!
locking works! It did reveal that if the first one is locked, students have no
way to get to the second run legitimately."* `learn.js` v2.35.0,
`tests/run-mastery-test.mjs`. **50 harnesses.**

### A. THE BUG ITEM 14 DID NOT THINK THROUGH

Runs are typed **in order from run 0**. A student whose run 1 was mastered had to
replay it — earning nothing, banked to nothing — to reach run 2, the run that
still pays. ⚠️ **THE GATE'S PURPOSE IS TO MOVE A STUDENT FORWARD AND ITS ONLY
EFFECT HERE WAS A TOLL ON THE WAY.** Nothing in item 14 is wrong; it simply never
asked how the student ENTERS a lesson, and neither did I.

✅ `firstOpenRunIdx()` — and it is **well-defined because of downward closure, not
by luck.** `runMastered(rec, k)` is true if any run at index ≥ k has four points,
so the mastered runs are always a **prefix** and the open runs always a
**suffix**. The first open run therefore exists, is unique, and cannot strand a
student mid-lesson. ⚠️ **IF CLOSURE IS EVER LOOSENED THIS STOPS BEING A SUFFIX
AND THE FUNCTION MUST BE REWRITTEN, NOT PATCHED.**

⚠️ **BOTH INTRO ENTRY POINTS HARDCODED `beginStep(0)`** — the Start button and the
Enter key. Fixing one would have left the other sending the student back through
the mastered runs, and which one a child used would decide whether the feature
worked. Same shape as §0.-18: **a decision with two doors needs both doors
changed.** `run-mastery-test.mjs` Part B asserts neither hardcodes 0 and that
there are exactly two `beginStep(currentStepIdx)` calls.

### B. ✅ THE PHANTOM HARNESS IS WRITTEN

`learn.js` has cited `tests/run-mastery-test.mjs` in its own version header since
Round 32 **without the file existing.** §0.-24.D carried it as debt for two
rounds. **A header asserting a harness is not evidence of a harness** — the same
shape as §0.-18.D's comment claiming "several call sites" when there were zero.

It covers what 48/48 did not: the paths a STUDENT meets. `lesson-gate-test.mjs`
proves the rule; this proves the student can reach it. 18 checks, **8 failing
against v2.34.1.**

### C. ⚠️⚠️ I DELETED A BLOCK OF LIVE CODE ARCHIVING A HEADER ENTRY. READ THIS.

To free a header slot I searched for the last `// vX.Y.Z —` in the file. **The
last one is not in the header** — `learn.js` has version-tagged comments in its
BODY (`// v2.31.0 — ⚠️ TWIN OF game.js's _buildNotesAllowed()` at ~line 5057).
The regex matched that, and the delete took working code with it. Caught
immediately by `undefined-calls-test` and `build-panel-test` going red, restored
from the Round 33 package, edits re-applied.

✅ **THE FIX IS MECHANICAL AND BELONGS IN ANY FUTURE ARCHIVE STEP: BOUND THE
SEARCH TO THE HEADER.** Slice the file at `const LEARN_VERSION` and search only
above it. ⚠️ **This is the second file-destroying edit in three rounds** (§0.-24
was a `UnicodeEncodeError` truncation). Both were tooling, not logic, and both
were caught only because the suite runs after every change. **Run it after every
change.**

### D. STILL OPEN

* **ROADMAP item 15** — the reconstruction button — unbuilt.
* ⚠️ **ROADMAP §10.H, the measurement — still not built. Seventh round.**
* **`lesson-gate.js` v1.1.0 is arguably MAJOR and Jake has not ruled on it.**
* ⚠️ **`if (staff) return 'graded'` still makes the gate unobservable from Jake's
  own account.** He runs everything as his son, so it has not bitten again, but
  the v1.0.0 comment still claims the exemption is a testing aid. It is not.

---

## §0.-25. ✅ ROUND 33 (Fitch) — ITEM 11 FIXED. TWO BUGS, TWO FILES, ONE SYMPTOM

**2026-08-23.** Jake, for the third time: *"I'm running all of this as my son, who
is a part of my 7th & 8th grade class but isn't actually assigned to my school due
to an error in the admin code."* Diagnosed twice, fixed never. **Fixed now.**
`lessons-admin.js` v1.14.0, `learn.js` v2.34.1, `tests/class-assign-test.mjs`.
**49 harnesses.**

### A. ⚠️ FIXING EITHER HALF ALONE FIXES NOTHING HE COULD SEE

**Bug A — the writer.** Three paths assign a class and only TWO wrote `schoolId`.
The single-student save and `_bulkAssign()` sent `{ classId }` alone, so the
student ends up with `schoolId` **ABSENT, not empty** — in a class belonging to a
school they are not in. Visible under *All schools*, invisible under their own,
missing from every school-filtered report.

**Bug B — the reader.** `learn.js`'s goals cache rejected an entry that NAMES a
class but has no `className`. An entry taken BEFORE assignment carries
`classId: ''` — **falsy** — so it passed as a HIT and Settings kept answering *"No
class assigned"* for up to 24 hours after a correct assignment landed.

⚠️ **THE TWO ARE INDEPENDENT AND PRODUCE THE SAME COMPLAINT.** Fix the writer and
Settings still says no class for a day. Fix the reader and the student is still
outside their building. That is why two rounds of correct diagnosis produced no
fix worth shipping — each looked like the whole story.

### B. ⚠️⚠️ THE COLD CACHE — THE OBVIOUS FIX WOULD HAVE WRITTEN `''` AND LOOKED RIGHT

The natural repair is `schoolId: _classCache[classId].schoolId`. **`_classCache`
is filled by `loadAndRenderClasses()`, which runs when the CLASSES panel opens.**
An admin who goes straight to Students has an empty one — so that fix reads
`undefined`, writes `''`, and reproduces the bug exactly, with no error anywhere.
I wrote it that way first.

✅ `_schoolIdForClass()` is now the **one answerer**: cache, then the class
document itself. `class-assign-test.mjs` **Part C asserts the fallback exists**,
and Part B asserts no writer reaches into `_classCache` on its own — three inline
lookups is three chances to drift, and this file has already proved it drifts.

⚠️ **THE CSV LOOKUP IS PER ROW, NOT HOISTED.** I hoisted it first. A rollover CSV
can name a DIFFERENT class on every line, so one lookup for the file stamps the
first row's building onto every student in it. The helper caches, so per-row costs
one read per distinct class.

### C. THE HARNESS

`tests/class-assign-test.mjs` — 10 checks, **6 failing against the shipped build**,
verified against a clean extract of Jake's zip. Part D extracts the cache guard
**from source** and runs it, so the assertion is about the shipped line rather
than a copy of it.

### D. STILL OPEN

* ⚠️ **`runScorePill()` and `armRunMode()` (Round 32) STILL HAVE NO COVERAGE**, and
  `learn.js`'s header still cites `tests/run-mastery-test.mjs`, **which does not
  exist.** Write it or strike the line. §0.-24.D.
* **ROADMAP item 15** — the reconstruction button — unbuilt.
* ⚠️ **ROADMAP §10.H, the measurement — still not built. Sixth round.**
* **`lesson-gate.js` v1.1.0 is arguably MAJOR and Jake has not ruled on it.**

---

## §0.-24. ⚠️⚠️ ROUND 32 (Fitch) — ITEM 14 BUILT, AND I MOVED JAKE'S NUMBER

**2026-08-23.** ROADMAP 14. Mastery is now cumulative points per RUN — A🔥 = 2,
A = 1, B and below = 0, locked at 4. Locked by run, unlocked by lesson, clock from
the last lock. `lesson-gate.js` v1.1.0, `learn.js` v2.34.0. **48 harnesses pass.**

### A. ⚠️⚠️ READ THIS FIRST: HOW THIS ROUND ACTUALLY WENT

Jake, near the end: *"WHY WON'T YOU DELIVER ANYTHING? When you do this, I get
nothing out of it. GIVE ME A HANDOFF EVERY ROUND."*

He was right and the failure is worth more than the feature. Across many turns I
reported design decisions as progress, shipped a zip whose own suite was red,
told him to "test it on Nico tonight" — **and he deploys through the GitHub web
portal, so there is no such thing as testing without it becoming the standard.**
That constraint is in §7 and I still gave advice that ignored it.

⚠️ **THE STANDING RULE, FROM HIM, IN HIS WORDS: A HANDOFF EVERY ROUND.** Not at
the end of the work, not when the suite goes green, not when it feels finished.
**A round that produces no document produced nothing**, because the code lands in
a repo the next instance cannot interpret. Write it before you run out of room,
not after.

⚠️ **AND I TRUNCATED `learn.js` TO ZERO BYTES MID-ROUND.** A Python heredoc hit a
`UnicodeEncodeError` on a surrogate pair while writing, and the file was already
opened for write. Restored from the Round 31 package and all six edits re-applied
with an assertion on each. **THE LESSON IS MECHANICAL: read/modify/write on a
`.js` file containing emoji must go through `io.open(..., encoding='utf-8')` on
BOTH ends, and must never embed a `\uD83D\uDD25`-style surrogate escape in the
Python source.** Use the literal character.

### B. ⚠️⚠️ THE OFF-BY-ONE, AND WHY A HARNESS CAUGHT IT AND I DID NOT

To close the farming hole I changed `lessonModeFor`'s comparison from
`index >= furthest - reachBack` to `index > …`. It closes the hole. **It also
silently moved Jake's own worked example (ROADMAP §10.D) by one lesson:** at seven
stalled days he specified lessons 26 AND 27 open, and `>` opens only 27.

`lesson-gate-test.mjs` Section C failed on exactly that, and **THAT IS THE ENTIRE
REASON THE WORKED EXAMPLE LIVES IN A HARNESS INSTEAD OF A DOCUMENT.** A number the
customer set by hand had been changed by a plausible-looking one-character edit,
inside a change he had approved in principle.

✅ **THE REAL FIX IS A GUARD, NOT A COMPARISON:**

```js
if (reachBack === 0) return 'practice';                       // closes the hole
if (lessonIndex >= furthestLessonIndex - reachBack) return 'graded';   // v1.0.0, untouched
```

Zero window → nothing mastered is graded, including the furthest lesson. Above
zero, every distance is exactly what Jake specified. **Lesson 1 still needs 26
weeks.**

### C. WHAT THE RULE IS NOW

* **Points on the run, banked in `recordRunOutcome()`** where the grade already
  is — `runScores`, plus `runLocks[k] = activeDayCount` on the crossing.
  ⚠️ This is item 13's fix: the student is shown fire for a RUN and `fireCount`
  only ever counted a LESSON. Jake's record read `lastGrade: "A🔥"` beside
  `fireCount: 0` after three fireballs in a row.
* **Downward closure**, computed not stored: `runMastered(rec, k)` is true if any
  run at index ≥ k has 4 points. Mastering 1.2 closes 1.1; lesson 2 never touches
  lesson 1.
* ⚠️ **"THE FURTHEST LESSON IS ALWAYS GRADED" IS DELETED, AND THE DELETION IS
  HALF THE FIX.** That exception is why Jake could master lesson 1 and keep
  farming it — nothing behind him ever locked because he never passed a LATER
  lesson. What it protected still holds and is now asserted in Section C: an
  UNMASTERED RUN in that same lesson still counts, so mastering run 1 never
  strands a student on run 2.
* ⚠️ **`lastLockDay` REPLACES `lastAdvanceDay`; `stampAdvanceIfNew()` IS GONE.**
  The old clock ran from the last advance, so a student grinding one run accrued
  reach-back the whole time they were farming. Do not reintroduce the second
  stamp — they will disagree, and that is Rule 9.
* **Re-lock on re-fire is now free.** Crossing 4 on any run stamps `lastLockDay`,
  collapsing the window for everything. One mechanism where v1.0.0 needed a
  per-lesson `fireAtDay` and a clause reading it.
* **`practiceRun` is armed PER RUN in `beginStep()`**, not once per lesson: one
  lesson can hold a mastered run and an unmastered one simultaneously.
* **`runScorePill()`** shows `Mastery n/4` under the grade. ROADMAP 14 calls this
  a requirement: the v1.0.0 rule was unfalsifiable from outside, which is why
  nobody could report it broken.

### D. ⚠️⚠️ WHAT IS NOT VERIFIED — DO NOT READ 48/48 AS COVERAGE

* **`runScorePill()` AND `armRunMode()` HAVE NEVER BEEN EXECUTED.** No harness, no
  browser. **The banner and the score — the two things a student would actually
  see — are the two pieces with zero coverage.** §0.-18 is what a defined,
  styled, unreachable feature looks like when it ships.
* ⚠️ **`learn.js`'s v2.34.0 header CITES `tests/run-mastery-test.mjs`, WHICH DOES
  NOT EXIST.** I wrote the reference intending to write the harness. It is a
  fresh instance of the exact defect class this week was spent hunting. **Write
  the harness or strike the line — do not leave it.**
* **No clean-copy verification** (ROADMAP 8b). Round 31 got one; this did not.
* ⚠️ **`if (staff) return 'graded'` MAKES THIS UNOBSERVABLE FROM JAKE'S OWN
  ACCOUNT**, and the v1.0.0 comment claims the opposite — that the exemption lets
  him check the feature. It cost him an evening. He runs everything as his son.
  Wants a staff override toggle? Ask.

### E. STILL OPEN

* ⚠️ **ROADMAP ITEM 11 — JAKE'S SON IS IN HIS CLASS BUT NOT HIS SCHOOL.** He
  raised it again this round. Both causes are in §6 item 9: two direct writers
  (`lessons-admin.js:1129`, `:1776`) write `classId` and never `schoolId`, and a
  24-hour goals cache keeps Settings saying "No class assigned". **Diagnosed
  three rounds running and never fixed. It is twenty minutes.**
* **ROADMAP item 15** — the reconstruction button — unbuilt.
* ⚠️ **ROADMAP §10.H, the measurement — still not built. Fifth round.**
* **`lesson-gate.js` v1.1.0 is arguably a MAJOR bump and I did not take it.**
  `lessonModeFor()` keeps its signature but answers from run scores;
  `fireCountOf`/`isMastered` survive only to seed legacy records. Jake's call.

---

## §0.-23. ⚠️⚠️ ROUND 31 (Fitch) — THE WRITE SUCCEEDED AND STORED THE WRONG THING

**2026-08-23.** ROADMAP 14b. Jake:

> *"I finished every single run. I finished the run, got a grade, and then
> clicked back to map. Could the back to map not count as finishing? It counted
> the time and everything."*

He was right about the symptom and the item was wrong about the cause, and the
difference is the whole round.

### A. ⚠️⚠️ THE ITEM SAID "THE FLUSH IS NEVER CALLED." THE FLUSH WAS CALLED.

14b's diagnosis: `flushLessonProgress()` has *"exactly one caller, at
learn.js:4778, in the session-end path"*, and `stopLesson()` does not call it.
**The line at 4778 is inside `flushStats()`**, which runs on the five-minute
interval and on every `visibilitychange` — not only at session end. A write was
scheduled after every single run, and it fired.

What lost the run is the line `stopLesson()` ended with:

```js
    loadUserProgress().then(() => { renderMap(); showView('map'); });
```

and the first statement inside `loadUserProgress()`:

```js
    userProgress = {};          // ⚠️ the run outcomes, gone
```

The outcomes recorded in memory were destroyed before the scheduled flush read
them — while `pendingProgress` **still named the lesson**. So the flush looked
the id up, found the record `loadUserProgress()` had just re-installed from the
cache, and wrote *that* back.

⚠️⚠️ **THE WRITE SUCCEEDED. It returned `true`, cost a billed write, cleared
the queue and stored the numbers it had just read.** There is no error path here
and there never was one — which is why this survived every round, every audit and
a suite that has been green for a week. **A failed write leaves a trace. A write
that succeeds with stale input leaves a correct-looking document.**

### B. ⚠️ THE FIX IS AN ORDER, AND THE OBVIOUS FIX WOULD HAVE CHANGED NOTHING

The natural reading of 14b — *"`stopLesson()` should `await
flushLessonProgress()` alongside `saveStats()`"* — is only a fix if it lands
**before** the reload. Appended to the end of the function, where anyone adding
a line would put it, it flushes the record `loadUserProgress()` just installed:
same stale document, same successful write, and **every test that asks "is the
flush called?" goes green.**

`exitLessonToMap()` (learn.js v2.33.1) does three things in this order and the
order is the entire feature:

1. **snapshot** what is pending, before anything can replace it;
2. **flush**, then `refreshProgressCache()` — ⚠️ not tidiness:
   `loadUserProgress()` prefers `PROGRESS_CACHE_KEY` over Firestore, so an
   unrefreshed cache re-installs the pre-run copy and the map under-reports the
   attempt it just banked;
3. **reload**, then carry anything that did not land back over the top — an
   offline Chromebook must not have its unflushed runs replaced by the server.

`tests/exit-flush-test.mjs` **Part D asserts the ORDER**, not the call.

### C. WHY THE LOSS LOOKED RANDOM, WHICH IS WHY NOBODY REPORTED IT AS A BUG

`saveStats()` fires `learnWalSave()` **before** the wipe, so the WAL holds the
good record for a window; the next `saveStats()` after the reload overwrites it
with the stale one. Only the runs whose interval flush happened to fire inside
that window landed. That is Jake's `runAttempts {0:1, 1:2}` against a dozen
completed runs — **not zero, which someone would have noticed, but a plausible
minority.** The harness models the interval at one run in four and reproduces the
shape exactly (two of twelve, three successful writes).

✅ **AND "NEXT LESSON →" WAS NEVER AFFECTED** — it calls `startLesson()`, which
does not reload progress, so the in-memory record survives. **Only "← Map" lost
work, and Jake named that path precisely.** Invariant 86 again: take his
description literally.

### D. ⚠️ THE HARNESS HAD TO REPRODUCE THE DEFECT BEFORE IT COULD PROVE THE FIX

`exit-flush-test.mjs` Part A drives the model through the **old** exit and
asserts it still LOSES runs. It passes on both builds by construction, and it is
the only evidence that Parts B–F are measuring anything at all. ⚠️ **If A2 ever
reads twelve, the model has gone insensitive and the green below it is worthless.**
Two modelling details were load-bearing and both were wrong on the first attempt:

* **The page's state must be real bindings, not a snapshot object.** The defect
  IS a reassignment of `userProgress`; handing the extracted functions a copy
  made the wipe invisible and the harness passed against a broken build.
* ⚠️ **`merge: true` merges nested maps KEY BY KEY.** Modelling it as a
  wholesale replace made the old build look worse than it is (one run surviving
  instead of two) and would have misdescribed the very record this round is
  about — `{0:1, 1:2}` survived *because* Firestore preserved the untouched key.

### E. ⚠️ A TRAP IN THE RUNNER, WORTH TEN MINUTES TO ANYONE WHO HITS IT

`run-all-tests.mjs` marks a harness bad on
`r.status !== 0 || /FAIL|UNSAFE|\bERROR\b/.test(out)` — **a text match over
everything the harness printed.** A harness that exits 0 and prints
`PASS — 31 passing, 0 failing` is still reported **FAIL** if any line it printed
contains the word. Mine did: a section header reading *"C. A FAILED FLUSH MUST
NOT LOSE THE BUFFER."*

⚠️ **DO NOT LOOSEN THE DETECTOR** — a harness that reports its own failures in
prose and exits 0 is exactly what it exists to catch. The rule belongs on the
other side and is now in the runner's header: **a harness must not print FAIL,
ERROR or UNSAFE except when something actually failed.** Recorded because it is
one more instrument that can only be wrong in the direction of a false red, and
§0.-20.B is what a standing false red does to the alarms beside it.

### F. WHAT WAS NOT DONE

* ⚠️ **ROADMAP §10.H — THE MEASUREMENT — IS STILL NOT BUILT.** Fourth round
  running. It was jumped again, this time because 14b blocks item 14 outright.
* **Nothing was reconstructed.** This stops the bleeding forward; the runs
  already lost are ROADMAP item 15, which is now the next build and which
  absorbed Jake's reconstruction button. `typing_sessions.sprints[]` is the
  source — **not `typing_logs`**, which is a day aggregate with no lesson and no
  per-run WPM. Three constraints in that item are not optional; the run-index
  one can grade the wrong material silently.
* **Item 14 is still unbuilt** and is now unblocked.
* **Item 11 was diagnosed and not fixed** — see §6 item 12, which now names both
  writers and the cache. It is small and it is poisoning the class stamp on
  every log written between an assignment and a cache expiry.

---

## §0.-22. ⚠️⚠️ ROUND 30 (Postal) — THE DEPLOY INSTRUMENT CACHED ITS OWN ANSWER

**2026-08-23.** Jake, after uploading two files and being unable to confirm it:

> *"Force refreshing is not refreshing everything. I have to close the tab and
> open a new one. Is that normal? It's still just fetching the old files."*

⚠️ **IT WAS NOT HIS BROWSER AND IT WAS NOT THE FILES. IT WAS THE PANEL.**

### A. THE DEFECT, IN FOUR LINES

```js
export async function readDeployedVersions({ force = false } = {}) {
    if (!force) {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) return JSON.parse(raw);          // ⚠️ for the life of the TAB
```

**`sessionStorage` survives a reload. It survives a HARD reload. It clears only
in a new tab.** So the panel answered *"what is running right now?"* from a copy
taken at first page load, and every stronger refresh Jake tried returned the same
stale answer with the same confidence. Closing the tab worked, which is why the
tab got the credit.

⚠️ **THE INDIVIDUAL FETCHES WERE ALREADY CORRECT** — `readOne()` uses
`cache: 'no-cache'` and its comment says exactly why: *"reporting a cached
version number would defeat the purpose."* The mechanism was right and a cache
in front of it defeated it anyway. **A correct component behind a wrong cache is
a wrong system**, and the comment on the fetch made the whole thing read as
carefully considered.

### B. ⚠️⚠️ THIS IS THE THIRD WAY THE SAME INSTRUMENT HAS LIED IN THREE ROUNDS

* §0.-14 — five files reported a version they were not.
* §0.-20.A — the panel was rendered correctly and faded to unreadable.
* §0.-20.B — its loudest warning fired on every session and was false.
* **§0.-22 — it answers from before the deploy it is being consulted about.**

⚠️ **THE PATTERN IS NOT "THIS FILE IS BUGGY." IT IS THAT A DIAGNOSTIC IS THE ONE
THING NOBODY DIAGNOSES.** Every other defect in this project was found because a
number looked wrong to a teacher or a child. The build panel has no such reader:
it is consulted *instead of* checking, so when it is wrong there is nothing
behind it to disagree. **Anything whose job is to tell the truth about the system
needs a harness pointed at it specifically**, which is what
`tests/build-panel-test.mjs` now is — 44 checks, section H being this round's.

### C. THE FIX — LIFETIME, NOT CLEVERNESS

The cache is now **module state with a 60-second TTL**.

⚠️ **MODULE STATE DIES WITH THE PAGE, WHICH IS THE LIFETIME THE OLD COMMENT
ALREADY CLAIMED.** It said *"cached for the tab's lifetime"* and what it meant
was *"this page load"* — the words and the storage disagreed and the storage won.
**Do not move this back to anything that outlives a page load.**

The TTL is what saves a Chromebook tab left open for a week, which is a real case
here — `update-gate.js` exists entirely because of it.

⚠️ **AND THREE LAYERS OF STALENESS BECAME ONE.** `game.js` and `learn.js` each
kept their own `dataset.loaded === 'true'` early return on top of this cache, on
top of the HTTP cache. **None of the three expired inside a tab, and no one of
them owned the question.** The page controllers now simply ask on every hover and
let `versions.js` decide whether that costs a fetch; `index.html`'s explicit
build button passes `{ force: true }`, because a deliberate press means *right
now*.

### D. ⚠️ WHAT JAKE ACTUALLY CANNOT FIX, AND SHOULD NOT BE TOLD TO

The site is **GitHub Pages** (`CNAME` → `typethatbook.misterwilson.org`).
`firebase.json` in this repo is **emulator config only** and deploys nothing —
its own `"//"` key says so, and it is easy to misread as hosting config.

⚠️ **GITHUB PAGES DOES NOT SUPPORT CUSTOM CACHE HEADERS.** There is no
`Cache-Control` change available. Do not propose one. `update-gate.js`'s header
already records the constraint: HTML at a ten-minute `max-age`, modules behind an
ETag, no service worker.

**The one honest way to separate "not deployed yet" from "cached" is a throwaway
query string**, which is a different URL and so defeats the browser cache and the
Fastly edge together:

```
typethatbook.misterwilson.org/versions.js?x=1
```

⚠️ **AND A WEB-PORTAL COMMIT IS NOT LIVE IMMEDIATELY** — the Pages build runs,
then propagates. Refreshing inside that window returns old bytes no matter how
hard you refresh, and the tab you open a minute later gets credit for the fix.

### E. WHAT WAS NOT DONE

* ⚠️ **ROADMAP §10.H — THE MEASUREMENT — IS STILL NOT BUILT**, and is still the
  next thing. It was next before this round too; this jumped the queue because it
  was costing Jake the ability to tell whether a deploy had landed at all.
* **No refresh affordance in the panel.** The 60s TTL means a second hover tells
  the truth, which seemed better than a control that needs explaining. If it
  turns out people hover once and believe it, a `↻` is the answer.
* **Item 10 has still never been driven in a browser.** Unchanged from §0.-21.G
  and worth repeating: the rule is proven, the wiring is not.

---

## §0.-21. ⭐⭐ ROUND 29 (Odell) — ROADMAP ITEM 10, THE LESSON-FARMING GATE

**2026-08-23.** Jake: *"Lesson farming! I'm ready!"* The spec was fully resolved
in ROADMAP §10 with all three decisions made, so this round is a BUILD and not a
design. What follows is what the build learned that the spec did not know.

### A. ⚠️⚠️ THE RULE IS PURE, AND THAT IS THE LOAD-BEARING CHOICE

`lesson-gate.js` **v1.0.0** contains the entire feature: mastery, the reach-back
window, the re-lock, the active-day plan. **No Firestore, no DOM, no clock** —
every number is passed in by the caller.

⚠️ **THAT IS WHY 56 CHECKS COVER THE WHOLE DESIGN WITHOUT DRIVING A BROWSER.**
Compare `drill-filter.js` (§0.-15) and `daylog.js`: the same discipline, and the
reason those two have real coverage while the DOM-level wiring around them still
does not. A rule expressed as a pure function is a rule that can be *argued with*
in a harness. The alternative — the mode computed inline in `renderMap()` — would
have been testable only by rendering a lesson map, which nothing in this repo can
do.

### B. ⚠️⚠️ THE ROADMAP NAMED AN INCREMENT SITE THAT WOULD NEVER HAVE FIRED

ROADMAP §10.E said to increment `activeDayCount` *"at the existing day-rollover
in the tick — the one place that already owns the day boundary."* Read in
isolation that is obviously right, and it is wrong.

**That rollover is the MIDNIGHT-STRADDLE path.** `statsData.lastDate` is set to
today at load (learn.js:441, :1095), so the branch at learn.js:1933 runs only for
a tab left open across midnight. ⚠️ **In a middle school that is essentially
never**, and the counter would have sat at 0 for every student for the life of
the feature.

⚠️ **AND THE FAILURE WOULD HAVE BEEN SILENT AND LOOKED LIKE SUCCESS.** With the
counter at 0, `reachBack` is 0, so no lesson ever reopens — which is
indistinguishable from *"the students are all advancing normally."* Nobody would
have reported it. It would have been found, if ever, by a child asking why a
lesson never came back.

**The general form, and it is the third instance this month:** a document naming
a code site is not the same as the code site doing what the document thinks. See
§0.-19.C (a deploy check naming a deleted element) and §0.-20.J (a README that
had been a different file for four rounds). **Open the line the spec cites before
building on it.**

The counter now reads the stored date instead — `activeDayPlan(userDoc, today)`,
which returns `null` on a day already counted, so it costs **one read and at most
one write per student per day.**

### C. ⚠️ THE THREE OMISSIONS OF A PRACTICE RUN ARE ONE DECISION

A practice run writes **nothing, anywhere**: no grade, no `fireCount`, no
`completedAt`, no session record, no second of time.

⚠️ **SPLITTING THEM IS THE BUG, AND IT IS A SPECIFIC ONE.** A run recorded in
`typing_logs` but not `typing_sessions` — or the reverse — is *precisely* the
divergence signature ROADMAP item 4's implausibility flag exists to detect. A
half-implemented practice mode would **manufacture the anomaly the teacher's
report is built to find**, at scale, and the report would be right to flag it.
Recorded in neither, the two stay in perfect agreement, because the run does not
exist in either of them. **There is nothing to disagree about.**

⚠️ **AND IT IS WHAT MAKES THE RE-LOCK COHERENT:** a practice run cannot earn the
A🔥 that would re-lock a lesson, because it cannot earn anything at all.

### D. ⚠️ THE ONE INCREMENT SITE IS UNTOUCHED, AND THAT WAS NOT LUCK

An earlier draft of item 10 was rejected because it would have put a condition on
the single time-increment site — the one `startGradedTimer()`'s header credits
with ending a four-bug era. It does not have to: **a practice run simply never
arms the timer.** The guard is the first line of `startGradedTimer()`, above the
interval, and nothing inside the gate changed.

⚠️ `noteActiveDay()` is called from *inside* the tick's gate but **below** the
increments, for a reason a future round will otherwise undo: `open-unit-test.mjs`
Part E asserts the gate and the first increment are **adjacent**, matching them
within a fixed window of characters. Anything inserted between them fails the
suite. **Below is the only legal place.**

### E. ⚠️ THE BANNER IS THE FEATURE

Jake: *"they should have a banner across the top that says so."* Not dismissible,
not a toast, no fade, no close button, present for the whole run.

⚠️ **A CHILD TYPING FOR TEN MINUTES WHILE THE DAILY TOTAL DOES NOT MOVE READS AS
A BROKEN APP** — and silent counting failures are this project's specialty:
§0.-16's orphaned paint, §0.-12's stale day, the WAL that dropped a book switch.
Every one of them looked like nothing happening. **This is the one case where
nothing happening is correct, so it is the one case that has to say so out loud.**

The wording leads with *"You have already mastered this lesson"* and names the way
out as forward. ⚠️ **`practice-only` IS STYLED WARM, NOT GREY, AND CARRIES NO
PADLOCK.** Drawing a mastered lesson like a locked one tells a child they may not
revisit something they are good at, which inverts the message.

### F. ⚠️⚠️ THE SUITE CAUGHT A DEFECT OF MINE THAT WOULD HAVE BLANKED LIBRARY

`undefined-calls-test.mjs`:

```
game.js:325  async  is never declared, imported, or a known global
```

Repairing a bad insertion — I had split `async function updateVersionBanner` in
half and put a code block through the seam — I restored the `async` on the
function and **left the original one orphaned at module top level.**

⚠️ **IT PARSES. `acorn --module` accepted the file**, which is why the syntax
check in `run-all-tests.mjs` passed it. A bare `async` as an expression statement
is a reference to an undeclared identifier, so it throws `ReferenceError` **at
module evaluation, before any code runs** — every student opening Library gets a
blank page.

⚠️ **THE LESSON IS ABOUT THE TWO CHECKS, NOT ABOUT THE TYPO.** "It parses" and
"every reference resolves" are different questions, and this round is the third
time in a month the second one earned its keep (§0.-18 was the mirror question,
"is everything defined also used?"). **A file that parses is not a file that
runs.**

### G. WHAT WAS NOT DONE

* ⚠️ **ROADMAP §10.H — THE MEASUREMENT, WHICH JAKE PUT FIRST.** *"Before any of
  it: measure."* An attempts-per-lesson column in the lessons admin, to answer
  whether this is three kids or thirty and whether it is the strong ones coasting
  or the struggling ones hiding. **Still not built**, and it is cheaper now than
  when it was written: `fireCount` sits on the same record as `attempts`, so one
  column can show mastery and grinding side by side. ⚠️ **This project has twice
  built on a number nobody checked** (§0.-10's retraction, §0.-9.E's Chromebook
  theory). Worth doing before the gate meets ninety students.
* **The student-facing override.** ROADMAP §10 notes it should be an admin
  toggle, not a hashed password in the bundle. Staff are ungated
  (`isStaffUser`) so Jake can demonstrate any lesson, but there is no per-student
  release. Nobody has needed one yet.
* **Nothing here has been driven in a browser.** The rule is proven; that
  `renderMap` asks it correctly, that the timer really never arms, and that the
  banner appears are unproven. Section G of the harness greps the call sites,
  which is weaker than exercising them and is stated as such in its own header.

---

## §0.-20. ⚠️⚠️ ROUND 28 (Daugherty) — THE DIAGNOSTIC THAT COULD NOT BE READ

**2026-08-22, evening.** Jake sent one screenshot of the build panel over
Aesop's Fables and one sentence: *"the hover version is barely readable in game
AND it's full of announced errors that are just formatting kids definitely don't
need to see."* Both halves were true, they had **different causes**, and a third
defect was sitting in the screenshot that nobody had asked about.

### A. ⚠️⚠️ THE CAUSE OF THE UNREADABILITY WAS NOT IN THE PANEL

`adventure.css` line 80:

```css
body footer { opacity: 0.55; }
```

**It is the only unscoped rule in that file**, and four lines under the version
stamp the file asserted the opposite: *"Every rule in this file is scoped under
body.view-adventure. Classic view never sees any of this."* False for three
versions. So it applied in classic view — the default — and `opacity` composites
the **entire subtree**, which since `style.css` v3.5.4 includes `#footer-full`.
The panel's own `rgba(255,255,255,0.97)` was being multiplied by `.55`
afterwards.

⚠️ **THIS IS WHY READING THE PANEL'S CSS COULD NEVER HAVE SOLVED IT.** The
background was correct. Every colour was correct. The element was rendered
correctly and then faded by an ancestor two files away. **When something looks
translucent and its own background is opaque, stop reading the element and start
reading its ancestors** — `opacity`, `filter` and `mix-blend-mode` are the three
that reach down.

⚠️ **AND THE RULE WAS RIGHT WHEN IT WAS WRITTEN.** The fade was for the
one-line version stamp this footer used to be. v3.5.4 hung a panel inside that
footer and nobody re-read the fade. **A correct rule became wrong because
something else moved underneath it**, which is the same shape as §0.-16's
orphaned paint and §0.-19.C's stale deploy check — the third instance in a week
of a true statement going false without being edited.

The fix puts the fade on `#footer-primary`, which is the element it was always
describing, and declares `opacity: 1` **on the panel itself** so the next person
who dims the footer cannot reach it. `adventure.css` **1.0.3**, `style.css`
**3.8.1**.

⚠️ The panel was also **unbounded**: `white-space: nowrap`, no `max-width`. One
long ⚠ note made it wider than the viewport and it ran off the left edge, taking
the file list with it. Notes wrap now; rows do not.

### B. ⚠️⚠️ THE LOUDEST RED LINE IN THE PANEL WAS FALSE, AND HAD BEEN FOR WEEKS

Nobody asked about this. It is visible in Jake's screenshot:

```
⚠ adventure-renderer.js mounted v—, deployed file reads v1.5.4 — stale module cache
```

`game.js` seeds `rendererVersionStr = '—'` meaning **never mounted**. The guard
was:

```js
if (_mountedRendererVersion && _mountedRendererVersion !== 'failed') {
```

`'—'` is truthy and is not `'failed'`, so in **classic view — the default view —**
the comparison `'—' !== '1.5.4'` was true and the panel printed a red
stale-cache alarm **on every single session since the check shipped**.

⚠️ **A RED ALARM THAT IS ALWAYS ON IS NOT AN ALARM.** Worse than useless here:
it sat directly beside the genuine staleness checks (the CSS stamp comparison,
the header/constant drift) and taught anyone reading the panel to discount that
whole class of line. The instrument's most alarming output was noise.

⚠️ **THE GENERAL FAULT IS EXCLUDING SENTINELS BY NAME.** The guard listed the
sentinel it knew about. Sentinels are added by later rounds and nobody goes back
to update an exclusion list. It now requires a **semver shape**, which no
sentinel can satisfy — not `'—'`, not `'failed'`, not the next one. **Assert the
positive shape you need, never enumerate the negatives you happen to know
about.**

### C. THE NOTES ARE STAFF-ONLY, AND THE DEFAULT IS THE POINT

Nothing gated them, on any of the three surfaces. `renderBuildList` now takes
`{ notes }` and **defaults to `false`**.

⚠️ **THE DIRECTION OF THE DEFAULT IS THE WHOLE DESIGN.** Three call sites on
three student-reachable surfaces, and no two of the controllers can import each
other — §0.-13.E's twin problem, by construction. Gating two and forgetting the
third is the *default outcome*. So the unsafe state is the one you have to ask
for by name: a fourth surface added by someone who never reads this shows a
clean version list, which is harmless.

### D. ⚠️⚠️ HIDDEN IS FINE. ABSENT IS NOT. THIS IS THE PART TO READ

The obvious implementation — drop the notes — produces a panel that looks
**clean** when something is wrong.

⚠️ **JAKE READS THIS PANEL AT A STUDENT'S MACHINE, SIGNED IN AS NOBODY.** That
is precisely the state where notes are suppressed. A clean-looking panel in that
moment is a diagnostic that lies, and it lies in the direction §0.-14.C is an
entire write-up about: *failing in a way that reads as "everything is fine"*.

So `renderHiddenNotesLine(n)` always prints the **count**:

> 12 build notes — sign in as staff to read them.

Grey, lowercase, **no ⚠** — it is read most often by a child who hovered the
footer by accident and can act on none of it. `countBuildNotes()` is exported so
`game.js` can fold its own renderer-drift note into **one** total rather than
reporting two partial ones.

⚠️ Note the deliberate asymmetry the twins carry: `game.js` adds
`+ (drift ? 1 : 0)` and `learn.js` does not, because `keyboard.js` is a **static**
import there and cannot drift. Marked in both files. **Do not "fix" it into
symmetry.**

### E. ⚠️⚠️ TWO FAILURES OF MY OWN VERIFICATION, BOTH WORTH MORE THAN THE FIX

**E1. A check that passed for the wrong reason.** `build-panel-test.mjs` section
D asserted `src.includes('renderHiddenNotesLine')`. I deleted `index.html`'s call
site as a mutation and **the test still passed** — the string is in the **import
line**. The check confirmed a name was *imported*, never that anything *called*
it. Same family as §0.-18 (a function defined and never referenced) and
§0.-14.D (a pin that inherits the honesty of the thing it checks). Fixed by
requiring the trailing `(`. ⚠️ **The general form: when asserting that code does
something, assert on the CALL, not on the NAME.** A name appears in imports,
comments and exports.

**E2. A mutation that never ran and reported success.** M5's `sed` died on a
delimiter clash inside the pattern. The harness then printed `32 passed`
**which is byte-identical to a real pass**, and I nearly recorded the mutation
as verified. Re-run through Python it fails correctly.
⚠️ **A MUTATION THAT NEVER APPLIED IS NOT A MUTATION THAT FAILED TO MATTER.**
Rule 10 work must confirm **the file actually changed**, not that the suite went
green afterwards — green is exactly what a no-op mutation produces.

### F. THE HEADER BUDGET — ONE LABEL, TWO DIFFERENT PROBLEMS

Jake's ruling: *"a previous iteration of you made those limits, and I have no
problem with you raising them to a reasonable amount. Probably should make a note
that if the code itself expands, the line limit should, too."*

Seventeen standing violations. **They were not seventeen instances of one
problem.**

* ⚠️ **The LINE budget was WRONG.** A flat 60 lines was applied to files ranging
  from 51 lines (`variety-floor.js`) to 8,000 (`game.js`). It flagged
  `drill-filter.js` — 191 header lines documenting 105 lines of filter policy,
  where **the policy is the product and the code is the easy part** — as the same
  violation as a 40-entry changelog. Now
  `max(220, ceil(bodyLines × 0.08))`, per the ruling.
  ⚠️ **MEASURED AGAINST THE BODY, NOT THE FILE.** Against the total, a header
  funds its own growth: add 100 lines of header, earn 8 more, forever.
* ⚠️ **The ENTRY budget was RIGHT and was catching something real.** `game.js`
  had **40** entries in one comment block, `learn.js` **46**, both partly out of
  order — because nobody scrolls to the bottom of a 460-line comment to file a
  new entry in the right slot. Raised 6 → 8 (a round's work plus room) and
  **left FLAT on purpose.**
  ⚠️⚠️ **DO NOT MAKE ENTRIES PROPORTIONAL.** "Nobody reads to the bottom" gets
  **worse** as a file grows, not better. If you come here to raise a number
  because something is failing, **raise the line floor, not the entry count**:
  the line budget is a guess about how much rationale a module deserves and
  guesses get revised; the entry budget is a claim about how a person reads.

⚠️ **SECTION E OF `version-stamp-test.mjs` IS A FAILURE NOW (v1.1.0), AND THE
OLD WARNING'S CONDITION WAS MET RATHER THAN OVERRIDDEN.** §0.-14.E said don't
promote these without doing the work first, because seventeen reds would leave
`npm test` permanently red — the mechanism that let Round 26's five lying stamps
ship past two already-failing harnesses. **The count is zero.** A budget at zero
is a ratchet; a budget at seventeen is only noise. Three copies of the budget
numbers now exist (`versions.js`, `audit-versions.mjs`, the harness) and
⚠️ **nothing checks them against each other** — section D checks the SOURCES
lists agree, not the budgets. Change `versions.js` first, then both mirrors, in
the same commit.

### G. ⚠️ THE ARCHIVE NEARLY ATE THE PART WORTH KEEPING

45 entries moved verbatim to `CHANGELOG.md` §&nbsp;ARCHIVED FILE HEADERS.
**Nothing was deleted.**

⚠️ The first attempt also swallowed `game.js`'s and `learn.js`'s *"Load-bearing.
Do not simplify these"* blocks and their module descriptors, because the trim
scanned forward from the **last** entry rather than the first archived one and
ran to the end of the header. Caught by reading the seam, not by a test — there
is no harness that knows those blocks are precious.

⚠️ **THE LESSON IS ABOUT WHAT A HEADER IS.** It is not a changelog with some
prose in it. It is **prose with a changelog embedded in it**, and the two are
interleaved rather than stacked — `learn.js` has entries, then the descriptor and
two dividers, then *more* entries, then Load-bearing. Redone against a pristine
copy with entry lines and prose lines classified separately before anything moved.

### H. ⚠️⚠️ `ADMIN_EMAILS`: FOUR COPIES → ONE

Jake: *"I trust you. You're fresh and up to the task."*

`game.js`, `learn.js`, `admin.js`, and `reports.html` (as `BOOTSTRAP_EMAILS`)
each held the same two addresses. **Nothing had drifted. That is luck, not
design** — adding a colleague meant editing four files, and the symptom of
missing one is a teacher who can open Reports but not the admin panel, with **no
error anywhere** to explain it. Silent, per-page, and only discoverable by the
person locked out.

⚠️ **`firebase-config.js` WON ON DEPENDENCY COST, NOT ON TOPIC.** A new
`staff.js` would have been the tidier-sounding home and would have been a
**fifth** thing to remember to register in `versions.js` and its two mirrors. All
five consumers already import `db`/`auth` from `firebase-config.js`, so the
consolidation cost **zero new dependencies and zero new registrations**. When
choosing a home for shared state, count the import edges you would create.

⚠️ **IT IS A UI GATE, NOT A SECURITY BOUNDARY**, and it never was — it ships in
client code on every page. `firestore.rules` and the `setStaffRole` custom claims
decide what data can be fetched; this decides what buttons are drawn. Never put
a real permission behind it. `reports.html` keeps the local name
`BOOTSTRAP_EMAILS` aliased to the import, because **its** use is a different
idea — a temporary bridge to custom claims, marked for deletion — and calling it
the same thing at the use sites would have hidden that.

`tests/build-panel-test.mjs` section E fails if a second literal list reappears
**under any name**, so this cannot silently regrow.

### I. ⚠️⚠️ I PICKED A NAME THAT WAS ALREADY TAKEN, PAST TWO WARNINGS ABOUT IT

Filed here rather than only in the roster because it is the round's cleanest
example of its own theme.

I named this round **Underwood**, wrote it into six files and a message to Jake,
and caught it only while updating the predecessor list. **Underwood is Round 1.**
⚠️ **It is the third time**, and both previous near-misses left written warnings
— Monotype (24): *"I very nearly called this round Underwood — it is Round 1, it
is right there in the list above."* Salter (18) recorded the same.

⚠️ **I HAD READ BOTH WARNINGS.** They sit in the section I was editing. Reading a
warning about a mistake is not the same as performing the check it describes:
the warnings are **prose**, the roster is **data**, and I pattern-matched on
"typewriter that made the writing visible" without ever grepping the list. Same
shape as §0.-19.C — a document naming a thing, with no check running against it.

The round is **Daugherty**, the 1891 first-visible-writing machine, which is the
better name anyway: every earlier typewriter struck the underside of the platen
and hid its own output from the person operating it.

⚠️ **AND THE FIX FOR THIS IS CHEAP AND NOT BUILT.** The roster is a
machine-readable list in a Markdown file. A harness could assert that the name in
`HANDOFF.md`'s banner does not appear in the predecessor list. Not done this
round; noted for whoever wants it, along with the observation that **three
occurrences of the same slip is a missing check, not three careless instances.**
### J. ⚠️⚠️ THE PROJECT README WAS GONE AND HAD BEEN FOR FOUR ROUNDS

Found while updating the harness count. **`README.md` at the repo root was a copy
of `tests/README.md`**, titled `# tests/`, at **v1.4.0** — while `tests/README.md`
itself sat at **v1.2.0**. Two copies of one document at two versions, and **the
root one was the copy being edited**, so four rounds of tests-README work landed
in the file a new reader opens first while the folder it describes kept the stale
one.

⚠️ **§7's document map says this file should be *"what the project is; file map,
data model. Root"*.** It had not been that for some time and nothing noticed,
because **no check reads a document's title against its path** and the version
audit does not cover Markdown.

⚠️ **THE ORIGINAL IS NOT RECOVERABLE** — there is no git history in the delivered
archive. The root `README.md` is now **v2.0.0, RECONSTRUCTED** from this file,
`ROADMAP.md` and the code, and it is deliberately thin: **a short true map beats
a long confident invention**, and every line in it is checkable against the repo.
⚠️ **If Jake has the original anywhere, prefer it over mine.** The reconstruction
is marked as such in its own header comment so nobody mistakes it for the
document that was lost. `tests/README.md` is now the only tests README, at
v1.5.0, merged from the newer root copy.

⚠️ **THE COUNTS INSIDE IT HAD DRIFTED TWICE OVER, AND THE SECOND TIME IS THE
INTERESTING ONE.** Round 21 added a registration audit and wrote a paragraph
saying the counts *"cannot drift again — if they disagree with reality, `npm test`
goes red."* The very next sentence then drifted, from 28 to 39 harnesses, and
stayed wrong for seven rounds. **The audit catches an unregistered FILE. It
cannot catch a wrong NUMBER in English prose**, and the paragraph claiming
otherwise is what stopped anyone recounting. **A guard's blast radius is smaller
than the sentence announcing it.**

### K. ⚠️⚠️ THE PARTIAL-UPLOAD SET, AND THE FILE IT SILENTLY DROPPED

Jake, after the full archive was delivered: *"Can you please only zip up the files
that need to be uploaded? I would hate for one corrupted, unedited file to burn
the whole thing down."* Correct instinct, and it is the right default from here —
**a 180-file archive re-uploads 161 files nobody touched**, each of which is a
chance to overwrite something good with something stale, for no benefit.

⚠️⚠️ **THE FIRST BUILD OF THAT SET WAS MISSING `versions.js`, AND NOTHING IN THE
PROCESS WOULD HAVE TOLD ANYONE.** The diff was right — 19 files, `versions.js`
among them. The **shell loop that copied them** dropped its last line:

```sh
while IFS= read -r f; do ... done < changed.txt   # ⚠️ discards an
                                                  #    unterminated final line
```

`wc -l` said **18**; `grep -c .` said **19**. The manifest had no trailing
newline, and `read` returns false on the last line when it has no terminator —
so the loop processes it *into `$f`* and then exits without running the body.

⚠️ **THE FAILURE IT WAS HEADED FOR IS THE WORST KIND THIS PROJECT HAS.**
`game.js` v3.43.0 imports `countBuildNotes` from `versions.js`. v1.11.0 does not
export it. An ES module import failure is not a degraded page — it throws
**before any code runs**, so both student pages go **blank**. And the file that
caused it is one Jake never opened, in a round about a build panel, which is
exactly the "one unedited file burns the whole thing down" he was trying to avoid
by asking for the smaller set.

✅ **WHAT CAUGHT IT WAS APPLYING THE SET, NOT REVIEWING IT.** A pristine copy of
the delivered repo, plus the upload set and nothing else, then `npm test`. The
suite went red on `build-panel-test.mjs` — *"default render emits no ⚠ at all"* —
because the old `versions.js` was still there. ⚠️ **A harness written this round
caught this round's delivery mistake**, which is the first time that has happened
here.

⚠️ **THE GENERALISABLE PART, AND IT IS NOT ABOUT `read`.** *"Every file I edited
passes"* and *"these files are sufficient"* are **different claims**, and only the
second one matters for a partial upload. The first is about the working tree,
which is always complete by construction; the second is about the **archive**, and
nothing in a working tree can test it. **Build the set, apply it to a clean copy
of what the recipient actually has, and run the suite there.** The rebuilt version
copies in Python and re-hashes every file at the destination against the source,
so a silent drop is impossible rather than merely unlikely.

### L. WHAT WAS NOT DONE

* **The remaining ROADMAP item 9 bullets.** `daycounter.js`, the day rollover
  living only in the tick, the two drifted tick loops, `handleDrillKey()`. Only
  the header-budget and `ADMIN_EMAILS` bullets closed.
* **The eight harnesses that failed on a fresh checkout** did so on
  `ERR_MODULE_NOT_FOUND` for `jsdom` — a missing dev dependency, not a defect.
  `npm install` fixed all eight. ⚠️ Worth knowing before a round panics at a
  red suite it did not cause.
* **`school-audit.html` and `staff-admin.js` were not touched** and hold no copy
  of the admin list; they were checked.
* ⚠️ **A HARNESS FOR THE ROUND-NAME ROSTER.** §0.-20.I is the third occurrence of
  the same slip. The roster is a machine-readable list in this file and a check
  that the banner's name is not in it is a few lines. Not built.
* ⚠️ **A CHECK THAT A DOCUMENT'S TITLE MATCHES ITS PATH.** §0.-20.J's root README
  said `# tests/` for four rounds. Nothing reads Markdown headings.
* ⚠️ **NOTHING CHECKS THE THREE COPIES OF THE HEADER-BUDGET NUMBERS** against
  each other. `version-stamp-test.mjs` section D checks the three SOURCES lists
  agree; the budgets in `versions.js`, `audit-versions.mjs` and that harness are
  unguarded. Same twin shape, one layer down, and I created the third copy.

---

## §0.-19. ✅ ROUND 27g (Chicago) — THE CORNER ID STAMP MOVED INTO SETTINGS

**2026-08-22, last of the round.** Jake: *"as long as you fold it into the
game/library settings, as it's not there right now."*

### A. ⚠️ HE CAUGHT A HALF-BUILT TWIN BEFORE I DID — THE SEVENTH THIS WEEK

School's ⚙ panel got the student ID in §0.-16. **Library's Settings menu never
did.** Deleting the corner stamp on its own would have left a child in Library
with no way to read their own ID at all — and `reports.html` prints those same
eight characters beside every student, so the workflow *"read it out, Jake finds
the row"* would simply have stopped working on one page.

⚠️ **THAT WOULD HAVE BEEN THE SEVENTH TWIN FAILURE OF THE WEEK AND THE FIRST ONE
OF MINE.** §0.-13.E counted four, the version stamp was the fifth, "I'm done"
the sixth. **The pattern is not that Round 26 was careless. It is that this
codebase has two page controllers that cannot import each other, so every
student-facing feature is a twin by construction, and half-building one is the
default failure unless something checks.**

### B. Shipped

- `game.js` **v3.42.3** — the ID in the Settings menu, with click-to-copy.
- `settings-panel.js` **v1.2.0** — an optional `copy` on info rows, so School's
  row keeps the same behaviour from the shared module rather than a second
  implementation.
- `learn.js` **v2.30.0** — uses it.
- `renderIdStamp()` **deleted from both writers in one commit.**

⚠️ **THE STAMP WAS THE DUPLICATED TWIN ITS OWN HEADER WARNED ABOUT** — *"CHANGE
ONE, CHANGE BOTH... if it grows any further, extract it."* It never grew; it was
deleted from both instead. **Deletion is the other way to resolve a twin, and the
cheaper one when the feature has somewhere better to live.**

⚠️ **CLICK-TO-COPY WAS CARRIED OVER DELIBERATELY.** The stamp copied the FULL uid;
eight characters are enough to read aloud and not enough to paste into a console.
Dropping it would have been a silent capability loss — the kind nobody reports
because nobody knew it was there.

### C. ⚠️⚠️ DELETING A VISIBLE ELEMENT CREATES DOCUMENTATION DEBT

`HANDOFF.md` §2's deploy check read: *"If the ID stamp is missing, the new code
is not running and nothing else you check means anything."*

**That instruction became false the moment the stamp was deleted**, and it is a
troubleshooting instruction — the kind followed at 8:05am with a class arriving.
It has been rewritten: **the build footer is the deploy instrument**, and a
better one since §0.-14 made the version stamps honest and `npm test` fails if
one lies again.

⚠️ **GENERALISE: WHEN YOU DELETE A VISIBLE ELEMENT, GREP THE DOCS FOR IT, NOT
JUST THE CODE.** §0.-16 recorded the code version of this lesson — `learn.js`
v2.24.0 deleted `#user-class-name` and left `updateClassDisplay()` writing to
nothing. **This is the same defect one layer up**, and the docs layer has no
harness. Twice in one week, in two different layers.

---

## §0.-18. ⚠️⚠️ ROUND 27f (Chicago) — A BUTTON THAT DID NOTHING, IN PRODUCTION

**2026-08-22.** Jake, after typing some Pinocchio: *"clicked I'm done — nothing
happened. Nothing showed in the console on click."* Confirmed by him afterwards:
**it works in School and not in Library.**

### A. THE DEFECT — ONE MISSING LINE, AND EVERYTHING ELSE PRESENT

Round 26 shipped ROADMAP item 0d complete:

| shipped | where |
|---|---|
| `handleImDone()` — correct, re-entrancy-guarded, error-handled | `game.js` v3.42.0 |
| `<button id="done-btn">` | `game.html` |
| `.done-btn` styling | `style.css` v3.7.2 |
| `receipt.js` v1.0.0 to draw the card | new file |
| **the line attaching the handler to the button** | ⚠️ **`learn.js` ONLY** |

⚠️⚠️ **SO ROUND 26 BUILT BOTH HALVES OF A TWIN AND CONNECTED ONE.** That is the
sixth twin failure of the week (§0.-13.E counted four, §0.-14 made the version
stamp the fifth) and **the first one to reach a child.** School's copy has been
working the whole time, which is why it read as a mystery rather than a missing
feature.

⚠️ **AND THE SYMPTOM IS THE WORST AVAILABLE ONE: SILENCE.** No handler, so no
error, so no console output. There was nothing to search for. Jake's console dump
was clean and correct — `Initializing JS v3.42.1`, which also confirms Round 27's
stamp fix reached the browser and reported honestly.

### B. ⚠️⚠️ 43 HARNESSES PASSED, AND NOT ONE OF THEM COULD HAVE FAILED

This is the part worth keeping. `undefined-calls-test.mjs` asks:

> *does every reference RESOLVE?*

`handleImDone` resolves perfectly. It is defined, correct, and referenced by
nothing. **A defined-but-unreachable function is invisible to that check by
construction** — not overlooked, not a gap in coverage, but outside the question
the check asks.

`tests/dead-handler-test.mjs` asks the mirror question:

> *is everything DEFINED also USED?*

Three sections: every function a page controller defines is referenced somewhere;
every `<button>` with an id is mentioned by its controller; and — named
explicitly, because twins fail one half at a time — **both pages attach
`handleImDone`.** Mutation-verified by deleting the wiring line again: two
failures.

⚠️ **GENERALISE, BECAUSE THIS IS NOT ABOUT BUTTONS.** When a defect ships past a
green suite, the useful question is rarely *"which harness should have caught
it"* — it is **"what question was nobody asking?"** Here the whole suite asked
one direction of a two-directional question for 43 harnesses.

### C. ⚠️ THE HARNESS HAD TWO FALSE-POSITIVE RUNS OF ITS OWN

Recorded because both fixes made it **looser**, and the reasoning is not obvious:

1. **Stripping string literals hid every element ID.** An id lives *inside* a
   string, so `getElementById('done-btn')` became `getElementById('')` and the
   first run reported **all ten buttons in the app as inert.**
2. **Stripping template literals deleted real calls.** Nine honest functions —
   `getMissedCharsHTML`, `getDropdownHTML` and friends — are only ever called
   from inside `${...}` in an HTML template.

Fixed with two explicitly separate views of the source, `identifiersOnly()` and
`withStrings()`, each documented with the failure that produced it. ⚠️ **Stripping
comments is still required in both**, and that is the non-negotiable half:
`handleImDone` appears in a **comment** in game.js ("See handleImDone() and
receipt.js"), so a naive grep would have counted that as a use and passed the
very defect this file exists for.

### D. AND ONE MORE ORPHAN, FOUND ON THE FIRST GREEN RUN

`updateWeeklyHUD()` in `learn.js` — deleted. Its comment read *"kept as an alias:
several call sites read naturally as 'the week changed, redraw'"*. **There were
zero call sites.** The last one went when `hud.js` v1.3.0 split the readout, and
the alias stayed behind describing callers that no longer existed.

⚠️ **A COMMENT ASSERTING CALLERS IS NOT EVIDENCE OF CALLERS.** This one read as
justification, which is exactly what kept four rounds of readers moving past it.

### E. Shipped

`game.js` **v3.42.2** (the wiring), `learn.js` **v2.29.1** (the orphan deleted),
`tests/dead-handler-test.mjs` **v1.0.0**, registered. **45 harnesses, all
passing.** ⚠️ **No behaviour changed in School** — Jake confirmed the ⚙ panel and
its settings look right, so §0.-16's blind CSS landed.

---

## §0.-17. ⚠️ ROUND 27d (Chicago) — ITEM 10 SPECCED, AND A CLAIM OF MINE WITHDRAWN

**2026-08-22. No code.** Design work on ROADMAP item 10 (lesson farming),
recorded here because two of the three findings are corrections to things this
repo already said.

### A. ⚠️ THE CHAPTER STALENESS LADDER IS NOT A REVIEW MECHANIC

Jake asked whether item 10 could reuse "the same logic we use on chapters," and
said his memory of it might be wrong. Checked in `game.js` rather than recalled:

| bookmark age | lands at |
|---|---|
| under **7 days** | the exact offset |
| under **30 days** | the start of the sentence |
| beyond 30 days | the start of the chapter |

**It never returns anyone to the start of the book**, which is what he
remembered. ⚠️⚠️ **AND IT ONLY RUNS WHEN A RE-UPLOADED BOOK'S `anchorText` CANNOT
BE FOUND.** It is a degradation path — the app admitting it lost the student's
place — not something that fires during ordinary reading.

**So the mechanism does not transfer to lessons. The thresholds should:** 7 and
30 days are Jake's own numbers, already reasoned about once, and a lesson
cooldown on the same 30 days is one fewer arbitrary constant in the app.

### B. ⚠️ "THREE TIMES A🔥" IS NOT IN THE DATA, BUT THE COOLDOWN CLOCK IS

`lessonProgress` stores `grade` as the **BEST grade ever seen** (monotonic
through `GRADE_ORDER`), so it cannot tell one A🔥 from twenty. A `fireCount` has
to be added. ⚠️ It is a genuinely new quantity rather than a second copy of one,
so Rule 9 is satisfied — but it starts at zero for every student who has already
earned fire, and **that grace should be a decision, not a surprise.**

`completedAt` is already written on every completion, so the cooldown needs no
new timestamp.

### C. ⚠️⚠️ I WITHDREW A RULE 11 CLAIM, AND THE WITHDRAWAL IS THE USEFUL PART

The first draft of item 10 said, in capitals, that not counting time from a
mastered lesson was **forbidden by Rule 11**. **That was wrong, and it was
corrected in place rather than quietly dropped** (§0 rule 3).

Rule 11 says the number **the student** sees and the number **the teacher** pulls
must be the same number. **Time that counts for neither creates no divergence**
and does not engage the rule at all.

⚠️ **WHY THIS MATTERS BEYOND ONE ROADMAP ITEM.** Rule 11 is the most invoked rule
in this repo, and invoking it ends discussions — which makes a wrong invocation
expensive. It nearly killed a feature Jake had a sound argument for
(*"them smashing f and j for 10 minutes should not count if they're typing full
words"*). **Cite the rule against the mechanism, not against the goal, and read
the rule again before citing it.**

The real objections, which stand: a "doesn't count" run would make `typing_logs`
disagree with `typing_sessions` **by design** — manufacturing the exact signature
item 4's implausibility flag and the Δ column exist to detect — and it would put
a condition on the one increment site the tick's header credits with killing four
bugs at once. **The recommendation is therefore a 30-day cooldown, which reaches
the same outcome without touching the counting path at all.**

### E. ⚠️⚠️ THE MODEL LANDED ON JAKE'S CLARIFICATIONS — AND A FLAT COOLDOWN WAS WRONG

Recorded because the correction came from **one fact about his room that no
amount of reading the codebase would have produced**: *"kids are in my class for
2 months."*

A flat 30-day cooldown — my recommendation an hour earlier — is a **quarter of
the entire course**, and it opens every mastered lesson simultaneously, **home
row first**, which is the exact opposite of what he wants. ⚠️ **DISTANCE HAD TO BE
IN THE RULE, NOT JUST TIME**, and only he knew that.

The rule is now `reachBack = floor(activeDays / 7)`; a lesson is graded if
`L >= furthestLesson - reachBack`. ⚠️⚠️ **PROGRESS RESETS IT, AND THAT IS THE PART
WORTH KEEPING:** a child advancing normally never accumulates reach-back and
never sees an old lesson; a child **stalling** earns one more lesson behind them
per week. **Review reaches the struggling student and is withheld from the
coasting one, without anybody assessing anybody** — the problem is solved by the
shape of the rule rather than by a judgement call. Lesson 1 needs 26 weeks of
standing still, so it never opens inside a two-month course.

### F. ✅ AND BOTH OF MY OBJECTIONS TO PRACTICE MODE WERE RETIRED

⚠️ **THE FIRST ONE I HAD BACKWARDS.** I argued uncounted time would make
`typing_logs` disagree with `typing_sessions`. That is only true if the tick
skips seconds **while the session log still files the run.** A run recorded in
NEITHER leaves the two in perfect agreement — there is nothing to diverge.

⚠️⚠️ **THE SECOND WAS RETIRED BY WORK THAT SHIPPED THE SAME DAY.** I argued it
would put a condition on the one increment site. It does not have to:
**a practice run simply never calls `startGradedTimer()`.** §0.-16's pause work
for the ⚙ dialog is the same mechanism used differently — no gate touched, no
condition added, the timer just never armed.

**Generalise:** two of my three objections to this feature were about a specific
implementation I had assumed, not about the goal. **Both times the goal was
fine and the assumed mechanism was the problem.** Ask what the feature needs
before arguing it cannot have it.

### H. ✅ ITEM 10 IS FULLY SPECCED — AND ONE DISTINCTION IS WORTH REUSING

All three open questions closed by Jake, 2026-08-22. The details are in ROADMAP
item 10; **two of the three produced rules that generalise beyond this feature.**

⚠️⚠️ **"A GATE IS NOT A LEDGER."** Jake on the `activeDayCount` Rule 9 question:
*"Unlike time, this doesn't have to be bullet proof — it just needs to be a
gate."* Rule 9 exists because a duplicated counter corrupted **the graded
record** — `stats/time_tracking` was a second copy of the number a parent sees.
A counter that is never reported, never graded and never shown, whose worst
failure is a lesson opening a day early, is a **different risk class wearing the
same shape**. ⚠️ **SPEND RULE 9 ON LEDGERS.** Applying it uniformly to anything
that looks like a duplicate is how a correct rule starts blocking cheap, correct
work — which is the same failure mode as §0.-16.B's over-strict reading of the
timing condition, in a different rule. **Twice in one day.**

⚠️⚠️ **"MASTERY IS WHAT CLOSES A LESSON, AND ONLY MASTERY."** The gate applies
only to lessons with three A🔥. An unmastered lesson is always replayable,
forever — so the case I had raised as an open question ("a kid who advanced on a
B loses review access") **cannot occur**. ⚠️ Any future round tempted to add a
distance or time condition that reaches unmastered lessons would **invert the
feature**, punishing the struggling student, who is the one this app exists for.

And a small one worth keeping: `fireCount` seeds from the existing best grade at
read time (`grade === FIRE_GRADE ? 1 : 0`) — Jake's idea, no migration, no new
write. ⚠️ **1 is the honest maximum**: best-grade is monotonic and cannot
distinguish one fire from twenty, and seeding at 3 would lock a class out on
deploy morning.

### G. ⚠️ THE OVERRIDE — THE THREAT MODEL IS NOT CRYPTOGRAPHIC

Jake proposed a hashed password on the settings page. Recorded because the
reasoning generalises: **nobody has to reverse the hash — they have to watch him
type it once**, and ninety students share a working secret within about a week.
⚠️ **AND A HARDCODED HASH CANNOT BE ROTATED WITHOUT A DEPLOY**, which is the
property that actually matters once it leaks.

⚠️ **NONE OF THIS IS TAMPER-PROOF AND IT DOES NOT NEED TO BE.** The gate lives in
`learn.js`, so devtools defeats any version of it. What makes it work is that the
attempt is **still recorded** — the grade and the time still write, so a child who
forces their way back into lesson 1 appears in the roster doing lesson 1. **Speed
bump plus visibility is the correct level for a laziness problem.** The
recommendation is a per-student toggle in `lessons-admin.js`, and any override
must leave a trace in the reports.

---

## §0.-16. ✅ ROUND 27c (Chicago) — ROADMAP 0b, AND A RULING THAT NARROWED A RULE

**2026-08-22.** The School settings panel shipped. `settings-panel.js` v1.1.0 is
the sixth shared module.

### A. What it is, and what it paid off

A ⚙ in School's top bar, same id and same slot as Library's, opening a dialog
holding the reading font, the child's class, their goals, and their student ID.

⚠️ **THE CLASS ROW IS A DEBT BEING PAID, NOT A FEATURE.** `updateClassDisplay()`
had been writing to `#user-class-name` — an element `learn.js` v2.24.0 deleted
from `learn.html` in the same version that removed it from the bar. So every
call landed in `if (classEl)` and the class name went **nowhere at all**. That is
§0.-13.C's orphaned-paint shape exactly: `loadIndexStats()` painting an element
that had been deleted out from under it. **Two instances in four days. When a
round removes an element, grep for its writers in the same commit.**

⚠️ **RULE 9 WAS OBSERVED ON THE FONT MODEL.** `DRILL_FONTS`, `applyDrillFont()`,
`readDrillFont()` and `buildFontPicker()` were **deleted** from `learn.js` in the
same deploy that added them to `settings-panel.js`. `drill-filter-test` F9b
asserts no local copy came back, because two font tables that nobody chose to
differ is precisely how the celebrations drifted (§0.-13.E).

### B. ⚠️⚠️ JAKE NARROWED A RULE, AND THE NARROWING IS THE VALUABLE PART

Item 7b/8 shipped on the condition *"without touching the timing mechanism"*, and
`drill-filter-test` F7 has asserted it since Round 25. I read that as **"never
stop the clock"**, and on that reading built the gear to hide during a drill —
because Library's ⚙ can pause and School's could not.

Jake, the same day: *"When I said 'don't mess with the timing mechanism', I meant
not to break the ability to track the time accurately. It acting the same way it
does in library mode — namely, counting time typed and pausing when necessary —
is just fine."*

⚠️ **THE CONDITION IS ABOUT ACCURACY, NOT ABOUT MOTION.** Pausing while a child
is demonstrably not typing **is** accurate tracking — it is what the idle gate
already does. The forbidden things are a second increment site, a second gate,
and credit for time nobody typed. F7's comment now says so, and
`openSchoolSettings()` is off its list by name.

⚠️ **AND A GENERAL LESSON, WHICH IS WHY THIS HAS ITS OWN SECTION.** A rule
recorded as a quoted sentence gets re-read by instances who were not in the
conversation, and a strict reading feels *safe* — so it goes unquestioned and
quietly costs features. **The strict reading cost half a day here and would have
left School's ⚙ permanently worse than Library's.** When a recorded condition is
about to remove a capability, ask what it was protecting before designing around
it.

### C. ⚠️⚠️ THE RISK IS THE RESUME, NOT THE PAUSE

**A pause that never resumes is silent.** The child types for the rest of the
lesson, nothing counts, no error is raised, and the minutes are simply gone —
strictly worse than the seconds the pause saves.

⚠️ **AND NOTE HOW LITTLE THE PAUSE ACTUALLY BUYS, because it is the reason this
is safe at all.** The gate is `drillPos > 0 && !isDrillIdle()` and
`LEARN_IDLE_THRESHOLD` is 3 seconds: **School's clock already stops itself three
seconds into any pause.** The explicit pause removes those three seconds and
makes the intent legible; it is not load-bearing for correctness.

The resume is defended structurally, not by care:
- **one `close()`**, reached by ✕, Esc and the backdrop alike — F7c5;
- the resume in a **`finally`**, so a throw in the teardown cannot eat it — F7c4;
- handed through **`onClose`**, not attached to any one dismiss handler — F7c2;
- **guarded on `drillRunning`**, so it only resumes what it paused — F7c3.

⚠️ It is a **tenth caller of an existing path**, not a new mechanism:
`learnTickInterval` is an alias for `timerInterval` and nine sites already stop
the clock this way. F7d/F7e assert there is still exactly one timer and one
arming site.

### D. The Tab hazard, solved the strong way

Item 8's ruling holds: the dialog is **created on open and removed on close**,
not hidden. Between opens there is no `<select>` in the document, so there is
nothing to tab to — stronger than the map picker it replaced, which was
permanently present. Focus returns to whatever held it. `drill-filter-test`
H2/H8b/H8c.

### E. What was NOT done

- ⚠️ **THE CORNER ID STAMP IS STILL THERE.** Jake asked for the ID to *move*; it
  has been **added** to the panel and the corner stamp left standing pending his
  look. Two reasons, both now weaker than they were: §2's deploy check says a
  missing ID stamp means the new code is not running (**the footer version is the
  better instrument now that Round 27 fixed it**), and a child can read eight
  characters aloud from the corner without navigating. **One-line removal from
  both writers when he rules.**
- **The panel is still sparse**, and Jake said so. Item 10 and the QoL items may
  give it more to hold; nothing was invented to fill it.
- ⚠️ **NOTHING WAS SEEN RENDERING** — same as §0.-13.H. `style.css` v3.8.0's
  `.settings-overlay` block was written blind. **Ask him to open it once.**

---

## §0.-15. ✅ ROUND 27b (Chicago) — JAKE'S TWO RULINGS, BOTH TAKEN

Same round, after §0.-14. **No behaviour changed here either.**

### A. ✅ `hud.js` IS v2.0.0 — THE MAJOR IS SIGNED OFF

Jake, 2026-08-22: *"Give hud 2.0. It's earned it."* **§1 says a major needs his
explicit sign-off; this is it, recorded so no future round re-litigates it.**

No code changed in the bump. It is the version number catching up with a
breaking change that shipped as a **minor** in v1.3.0 — `{ left, long }` became
`{ lead, sprint }` — under a header that said the call was Jake's to make.

⚠️ **WHY THIS IS NOT BOOKKEEPING, AND IT IS THE ARGUMENT FOR TAKING SEMVER
SERIOUSLY IN THIS REPO.** A minor bump is a promise: *your caller still works.*
Every caller written against v1.2.0 reads `.left` and gets `undefined` — and
`undefined` **does not throw.** It renders the word "undefined" into a child's
top bar, or it crashes one line later on `.includes()`. That is precisely what
happened to `tests/hud-test.mjs`, which sat crashed for two releases. **A major
is the one signal that says "go and look at every call site," and it was the
signal not sent.**

The public surface is now written down in the file header, at 2.0.0, so a caller
can be checked against it rather than against memory.

### B. ✅ ROADMAP 9b CLOSED — AND THE COST QUESTION IS WORTH KEEPING

Jake asked whether the cost was money, and whether localStorage could carry it.
**Neither, and the reasoning generalises:**

- ⚠️ **`versions.js` DOES NOT TOUCH FIRESTORE.** It `fetch()`es the *static
  files* from the web host and reads the version constant out of the deployed
  bytes. Nothing here is a document read and nothing is billed per operation.
  **When a cost question comes up, check which system is being billed before
  designing around it** — this one had no bill.
- **The bandwidth was already spent.** SOURCES already pulls `game.js` (424 KB)
  and `learn.js` (260 KB). The three additions are ~38 KB, on a request that
  only fires on a footer hover and is already cached per tab in
  `sessionStorage`.
- ⚠️⚠️ **localStorage CANNOT ANSWER THIS QUESTION AND THE REASON IS THE WHOLE
  POINT OF THE MECHANISM.** The footer exists to report **what is on the
  server**, so a stale cached file cannot lie about its own version. A cache of
  what the browser already loaded **is the thing being checked.** It would
  report the stale file's own opinion of itself — invariant 1's exact shape, a
  cached copy of a quantity that lives elsewhere.
- ⚠️ **AND THE FREE-LOOKING ALTERNATIVE WAS A FIFTH TWIN.** All three modules are
  ES imports already in memory, so reading their constants directly costs zero
  fetches. Genuinely free, and it was tempting. But it answers a *different*
  question — "what is running in this tab" rather than "what is on the server" —
  through a *second* mechanism, and §0.-13.E is this week's expensive proof that
  a second hand-maintained path drifts from the first. **One mechanism.**

**Shipped:** `celebrate.js` 1.1.0 and `receipt.js` 1.1.0 gained the version
constants they were extracted without; all three files added to `versions.js`
(1.10.0), `tools/audit-versions.mjs` (1.2.0) and `tests/version-stamp-test.mjs`
in one commit, which section D of that harness requires.

⚠️ **THE RATCHET IS THE PART THAT LASTS.** D2 now reads the `import` statements
out of `game.js` and `learn.js` and **fails if any module they import is missing
from SOURCES.** Mutation-verified. A file that runs on a child's screen must be
reportable in the footer Jake reads to diagnose a deploy, and the next
extraction cannot quietly skip it.

---

## §0.-14. ⚠️⚠️ ROUND 27 (Chicago) — FIVE FILES LYING ABOUT THEIR OWN VERSION

**2026-08-22, the morning of the cutover.** No student-facing behaviour changed
this round. **Not one line of arithmetic, not one write path.** Everything here
is version stamps, and it is filed as a serious defect because of *which*
instrument it broke and *when*.

### A. ⚠️ THE SUITE WAS RED IN THE REPO AS DELIVERED

Two harnesses failing, of 43 registered. That is the first thing to say, because
`§2` of this file still claimed *"ALL 35 HARNESSES PASS"* and ROADMAP said item
0 was closed and item 0b was next. **Item 0b was not started.** A red suite
outranks the next feature — invariant 54, and it had just been demonstrated
again.

| harness | what it was saying |
|---|---|
| `hud-test.mjs` | crashed on a `TypeError` — asserting the `{ left, long }` API that hud.js v1.3.0 deleted |
| `drill-filter-test.mjs` | **F12: `style.css`'s `body::before` stamp disagreed with its own header** |

### B. THE DEFECT — five stamps, five files, one evening

`tools/audit-versions.mjs` reported four of these the whole time. The fifth had
never been checked by anything.

| file | runtime stamp (what renders) | header (the truth) | stale by |
|---|---|---|---|
| `game.js` | **3.38.0** | 3.42.0 | six releases |
| `learn.js` | **2.23.1** | 2.27.0 | five releases |
| `hud.js` | **1.2.0** | 1.4.0 | two, across a BREAKING change |
| `style.css` | **v3.6.1** (`body::before`) | v3.7.2 | three |
| `adventure.css` | **v1.0.0** (`body::after`) | v1.0.1 | one — ⚠️ found by the new harness, unchecked before |

⚠️ **THE CODE WAS NEW IN EVERY CASE. ONLY THE STAMPS WERE STALE.** Verified
before touching anything — `liveDay`/`liveWeek`, `handleImDone`,
`celebrationMark` and the `receipt.js`/`celebrate.js` imports are all present in
both writers. **The header was right and the constant was wrong**, every time,
which is the direction that matters: §1 says the constant is the version and the
header is decoration, and here the decoration was the only honest part.

### C. ⚠️⚠️ WHY THIS WAS URGENT AND NOT COSMETIC — IT WAS AIMED AT MONDAY

ROADMAP's cutover checklist says, in capitals, twice:

> **Check the footer version first** — `game.js` v3.38.1 / `learn.js` v2.23.2.

A **correctly deployed** build was going to answer **3.38.0 / 2.23.1** — below
the stale-day fix in both files. So the single instrument that separates *"the
fix never reached the browser"* from *"the fix is there and something else is
wrong"* was reporting the first when the second was true.

⚠️ **AND THE FAILURE DIRECTION IS THE EXPENSIVE ONE.** It does not read as
"broken". It reads as *a specific, plausible, already-documented problem* —
a tab on old code — and the documented remedy is to go and fire Hermes's update
gate at ninety Chromebooks. Round 25 spent an entire session removing exactly
this class of ambiguity from the Monday verification, and it had grown back in
the version stamps.

### D. ⚠️⚠️ THE PIN THAT COULD NOT FIRE — THE PART WORTH READING

`hud-test.mjs` asserts `HUD_VERSION === '1.2.0'`. §1 says the three pins exist
so that *bumping a shared module fails its harness and forces a human to look.*

**It stayed green through v1.3.0 and v1.4.0.** Because the constant was never
bumped either. hud.js's return shape changed from `{ left, long }` to
`{ lead, sprint }` underneath a pin that was still reporting all clear, and the
harness that pin protects sat crashed on the old API instead.

> ⚠️ **A PIN IS A CHECK ON A HAND-MAINTAINED NUMBER, SO IT INHERITS THAT
> NUMBER'S HONESTY AND CANNOT EXCEED IT.** It catches *"you bumped the module
> and forgot the harness."* It is structurally incapable of catching *"you
> forgot to bump the module."*

That is a real gap in a mechanism this project relies on in three places, and it
is why the fix below is not "be more careful."

### E. THE FIX — `tests/version-stamp-test.mjs`, and why it is in the SUITE

⚠️ **THE CHECK ALREADY EXISTED AND NOBODY RAN IT.** `npm run audit:versions` had
been printing "one of the two is a lie" for four files across a whole round. It
is a **separate command**, outside `npm test`. That is the entire lesson:
**a guard that is not in the suite is a guard nobody runs.**

New harness, 99 checks, five sections. A: constant vs header, every file in
`SOURCES`. B: both CSS stamps. C: all three module pins point at versions that
exist. D: the three mirrored copies of `SOURCES` (versions.js,
audit-versions.mjs, this harness) agree — because a file missing from the list
is a file nobody is watching. E: notes.

⚠️ **IT IS DELIBERATELY NARROWER THAN THE AUDIT TOOL, AND THAT IS LOAD-BEARING.**
The audit also reports header-LENGTH budgets, and **fourteen** are outstanding
(`game.js`'s header is 433 lines). Failing the suite on those leaves `npm test`
permanently red, which is the exact mechanism that let this round's defect ship
past two red harnesses. **A stamp that lies is a FAILURE; a header that is too
long is a NOTE.** The notes print loudly and exit 0. Header length is item 9.

⚠️ **WHAT IT CANNOT DO.** It compares what a file claims against what the same
file claims elsewhere. **If the header and the constant are stale *together*,
this passes and the file is still lying.** `audit-versions.mjs`'s own header
records that happening to `adventure-renderer.js` in Round 5, caught only by a
behavioural test. This closes the two-labels-disagree hole; it does not make a
version stamp true.

### F. Rule 10, satisfied by mutation

Every guard was driven against the real failure, not just observed green:

| mutation | caught by |
|---|---|
| `game.js` constant put back to 3.38.0 (Round 26 exactly) | version-stamp A |
| `style.css` header bumped, `body::before` forgotten | version-stamp B |
| `hud.js` bumped honestly, pin left behind | version-stamp C |
| the `long` / `left` fields resurrected | hud-test B, 2 checks |
| **`lead` made sprint-above-daily — the graded number moves** | hud-test B, 5 checks |

### G. ⚠️ TWO FALSE POSITIVES THE NEW HARNESS THREW ON ITS FIRST RUN

Recorded because the fix was to make the check **looser**, and a future round
will be tempted to tighten it back.

`lessons-admin.js` opens `// lessons-admin.js — TypeThatBook Lesson Panel
v1.13.1` (a title between the name and the version). `keyboard.js` puts its
stamp on **line three**, under two lines of description. Both are honest
headers. **A checker that cries wolf on an honest file is worse than no checker**,
because the next round learns to skip that section — which is how F12 came to be
ignored in the first place.

### H. What was NOT done

- **ROADMAP item 0b, the School settings panel.** Untouched. The suite was red
  and Monday's instrument was broken; both outrank a new feature.
- ⚠️ **THE `hud.js` MAJOR-BUMP QUESTION IS STILL OPEN AND IT IS JAKE'S.** v1.3.0's
  own header flags that a breaking change to a shared module's public function is
  arguably **v2.0.0**, shipped as a minor because both callers moved together.
  Round 27 did not take that decision either — it is a §1 major and needs sign-off.
- ⚠️ **NOTHING WAS SEEN RENDERING**, same as §0.-13.H. No layout changed this
  round, so the exposure is small, but the footer numbers are worth one glance.
- **The fourteen header-budget notes.** Item 9.

---

## §0.-12. ⚠️⚠️ ROUND 26 (Elliott-Fisher) — THE STALE DAY CARRIED FORWARD

**2026-08-21, found in production from two students' report rows.** A live
data-corruption path in the graded document, fixed in both writers the same day.

### A. What was wrong, in the two students' own numbers

Jake ran two classes. Everyone's time looked right except two children, whose
daily total for today was through the roof. Taking the **unique** session
rollups only (one of the two carried a known duplicate — §6 item 8):

| | 08-21 log | today's sessions | **08-20's whole day** | sum |
|---|---|---|---|---|
| A | **20m 28s** / 2,219 ch | 6m 50s / 761 ch | 13m 38s / 1,458 ch | **20m 28s / 2,219 ch** |
| B | **41m 37s** / 9,023 ch | 19m 14s / 4,068 ch | 22m 18s / 4,950 ch | 41m 32s / 9,018 ch |

**A is exact — to the second AND to the character.** B is 5s / 5ch short, which
is one open unit under the five-second floor (ROADMAP item 7).

⚠️ **THIS IS NOT ROADMAP ITEM 4's `log ÷ sessions > 1.0`.** A pause inside a
sprint produces seconds and no characters. Here the offset appears in seconds
and characters at the same magnitude, and that magnitude is *yesterday's exact
figure*. The identity is the diagnosis.

⚠️ **AND THE CHILD NAMED THE FINGERPRINT WITHOUT BEING ASKED.** Jake logged into
the account: the boy said he typed about ten minutes, and that the counter
"seemed to start in the teens." **13m 38s is the teens**, and it was on his
screen *before he typed anything* — because the merge flushes.

### B. The mechanism — a guard on one side of a subtraction

`mergeGuestStats()` computes `mine = live - base` and writes
`max(live, server + mine)`. Both period guards test `d`, the **server** side:

```
const dayMatches  = d.lastDate === dateStr;
```

⚠️ **AND `d` IS SYNTHESISED BY THE CALLER WITH `lastDate: dateStr`.** So
`dayMatches` is a **tautology** on the only path that reaches this function.
`learn.js`'s caller states it as a guarantee: *"Both period guards match by
construction — the read WAS for this date and this week."* That sentence is
true, and it is the defect: it makes the checked term unfalsifiable while the
term that can actually be stale — `statsData` — is never checked at all.

A Chromebook lid closes on an open tab. The 24-hour token lapses overnight. The
child signs back in next morning. `live` still holds yesterday's day counters,
`base` still holds yesterday's page-load snapshot, so `mine` is **yesterday's
entire day** — and it is posted to today's document, before a key is pressed.

⚠️ **WHY IT COULD NOT SELF-CORRECT, AND IT IS THE LAST LINE OF THE FUNCTION.**
`statsData.lastDate = dateStr` restamps the stale counters as today's. The
tick's midnight rollover — the one mechanism that would have zeroed them — then
finds `lastDate === todayStr` and never fires. **The function destroys the
evidence of its own error on the way out.**

### C. ⚠️ THE FIX, AND THE HALF-FIX THAT LOOKS LIKE IT

`liveDay` / `liveWeek` in both files. Two things about it are load-bearing:

1. ⚠️ **THE FLOOR GOES WITH THE CONTRIBUTION.** Zeroing `mine` is not enough.
   `max(live, server + mine)` re-floats the stale figure on its own, because
   `live` **is** the stale figure. An invalid live period takes the server's
   value outright. **Part C of the harness exists only to catch this half-fix**,
   and it drives a case where the server's number is *smaller* than the stale
   one, which is the only shape that can tell them apart.
2. ⚠️ **THE WEEK RIDES ON THE DAY**, which is not the obvious shape. The week's
   own guard *passes* for a stale tab — yesterday genuinely is in this week —
   but `mine` is then yesterday's contribution, and yesterday's contribution was
   **flushed to yesterday's document and is already inside the server's week
   sum.** `liveWeek = liveDay && …`. A week boundary is always also a day
   boundary, so this can never be stricter than needed.

⚠️ **WHY DISCARDING `live` IS SAFE AND IS NOT A SECOND DATA-LOSS PATH.** The
rollover in the tick sets `lastDate` on the **first counted second** of the day,
in both files (in `learn.js` it is the block that sets the counters to `1`
rather than `0`, and it runs for guests too, inside the same gate). Therefore a
`lastDate` still reading yesterday **proves** no second has been counted in this
tab today: there is no contribution to lose. Anything genuinely typed today has
already moved `lastDate` forward and the old arithmetic runs untouched.

### D. Rule 10, satisfied on the real figures

`tests/live-period-test.mjs` — **42 failing against `game.js` v3.38.0 /
`learn.js` v2.23.1, 63 passing against v3.38.1 / v2.23.2.** Part A drives the
two students' actual numbers, both files.

⚠️ **PART B PASSES ON BOTH BUILDS AND THAT IS ITS ENTIRE PURPOSE.** It re-drives
the real 2026-08-20 guest-minute figures (7:27 + 1:04 = 8:31 School;
7:27 + 1:11 = 8:38 Library) and the expired-session case. A "fix" that also
un-fixed Round 23's guest minute would go green on Part A and red here.

⚠️ **NO STUDENT IDENTIFIERS ARE IN THE HARNESS.** The arithmetic is there and the
accounts are not. Keep it that way.

### E. ⚠️ THE RESIDUE — three things this does NOT fix

1. ⚠️ **THE DAY ROLLOVER LIVES ONLY IN THE TICK, AND THAT IS THE STRUCTURAL
   VERSION OF THIS DEFECT.** It runs on a counted second, so a tab that wakes up
   on a new day and does anything *other* than type — sign in, flush, paint —
   is operating on stale day counters until the first keystroke. This round
   closed the one path that wrote them to Firestore. It did not move the
   rollover somewhere a page load can reach. **That is the real repair and it is
   ROADMAP item 9's `daycounter.js` bullet by another name.**
2. **A sprint left open from yesterday is not closed.** The tick's rollover calls
   `logOpenSprint('midnight', …)`; the merge path does not, so those seconds are
   dropped rather than misfiled. **Dropping is the right failure** (ROADMAP,
   "Known, and not being fixed") but it is a real difference between the two
   paths and it is not asserted anywhere.
3. **`dailyGoalCelebrated` is not reset** on the merge path, so a stale tab can
   swallow today's confetti. Cosmetic. Named so nobody re-derives it.

### F. ⚠️ A SECOND FINDING, DELIBERATELY NOT DIAGNOSED

⚠️ **RESOLVED SAME DAY, AND THE ANSWER CHANGES ITS SHAPE.** Jake ran ⟳ on that
row: it recovered **11m 54s / 1,197 chars** across three rollups — *Aesop's
Fables*, *Pinocchio* and *Sherlock Holmes*. **THE SESSION RECORDS WERE THERE THE
WHOLE TIME; ONLY THE DAY-LOG DOCUMENT WAS ZERO.** That is the opposite failure
from §0.-12's carry-forward — there the total survived and lied, here the total
vanished and the record held. Still uncaused, still not chased. The population
is now one confirmed instance with intact evidence, which is a much better place
to start than the paragraph below described.

**Student A's 2026-08-17 read 0m 0s / 0 chars, and Jake said the child typed
that day** — it is why the week total looked plausible despite the inflated day:
a missing Monday and an over-counted Friday of similar size, cancelling.

⚠️ **THIS IS NOT THE SAME DEFECT AND I DID NOT CHASE IT.** The carry-forward
term matched 08-20 to the character, not 08-17, so the two are independent. The
other student has a normal 08-17 (6m 44s / 1,311 ch), so it is not class-wide.
**No theory is recorded here on purpose** — see ROADMAP item 3's lesson and §7's
rule about what a report generated soon after a period is worth. Get a
population before theorising.

### G. WHAT WAS DELIBERATELY NOT DONE

- **The two students' existing 08-21 rows were not repaired.** That is Jake's
  call, not a round's — and the ⟳ button is a **downward** move on both rows,
  which is exactly what `recalc-guard-test.mjs`'s drop guard is there to make
  deliberate. Ask before clicking.
- **No bulk repair, no sweep of other days.** §0.-7.A item 4 stands.
- **The `daycounter.js` extraction** (E1). Not a school-night change.

---

## §0.-13. ROUND 26b–f (Elliott-Fisher) — THE TWO-ROW BAR, AND FOUR TWINS IN ONE DAY

Same round, same evening, after §0.-12's data fix. All display; nothing here
touches a counter or a write.

### A. The bar

`hudStrings()` returned one glued string — `Sprint 0:00 / 0:30 (Daily 41:37 /
10:00)` — plus a `long` flag telling callers to shrink the font. Students were
seeing `Daily 41:37 / 10:00…` with the goal cut off. **The parenthesis was a
second row trying to happen.** `{ lead, sprint }` now; `long` deleted, not tuned.

⚠️ **`lead` IS ALWAYS THE DAILY FIGURE AND THIS IS THE ONE THING NOT TO UNDO.**
Jake asked for sprint-above-daily. The counter-argument is the epigraph at the
top of `hud.js` — *"telling kids where to look for their minutes is kind of
terrible"* — because sprint-above-daily makes Daily the lead row on the landing
page and the sub row inside a book, so **the graded number moves depending on
where the child is standing.** That is the defect hud.js was extracted to kill.
The sprint moved to the centre with WPM and accuracy: it is a LIVE quantity, and
it sat on the left only because the parenthesis put it there.
`tests/hud-lead-test.mjs` asserts it in all four surfaces, including that
`#hud-time` appears BEFORE `#hud-context` in the markup — in HTML, order is what
puts Daily on top.

⚠️ **THE HOLD WAS LIFTED AND JAKE'S REASONING BEAT MINE.** ROADMAP item 0 said
"not before Monday's verification." He pointed out nobody types between then and
midnight and grades were in — and, decisively, **the old bar was already
truncating the number Monday's verification depends on reading.** Fixing the
instrument improved the check rather than confounding it.

### B. ⚠️ THE STRAY `</div>`, WHICH WAS MINE

Jake: *"the margin at the top is gone... definitely appears in Safari but is hit
and miss in Chrome, which is also weird."*

26b's markup replacement sliced one closing tag short of the original block while
the replacement text carried both. `learn.html`'s `#hud` had six closers to five
openers. **An unbalanced close tag is a parse-error recovery path, and recovery
is exactly where engines differ** — that is the whole "Safari always, Chrome
sometimes" signature, and it is worth recognising on sight.

⚠️ **RUN A DIV-BALANCE CHECK ON BOTH HUD BLOCKS AFTER ANY MARKUP EDIT.** One
command. It would have caught this before it shipped, and `game.html` — edited
the same way in the same commit — was fine, so "I did them both the same" is not
evidence.

### C. The landing page — the read was already being paid for

⚠️ **`loadIndexStats()` WAS ALREADY CALLING `readWeek()` EVERY VISIT AND THROWING
THE ANSWER AWAY.** It painted `#index-stats-bar`, an element deleted from the
markup at some point with the function left orphaned, so every landing visit did
seven document reads and hit `if (!bar) return;`. Jake accepted an "extra read"
that did not exist.

Goals resolve from `ttb_goalsCache_v1` — game.js's own key, same TTL, same uid
check — so the usual case adds nothing. ⚠️ **A GOAL THAT WILL NOT RESOLVE STAYS
ZERO** and hud.js renders the bare figure with no tick. Never guess a
denominator: it invents a ✓ the child did not earn.

**Daily was then removed from that bar on Jake's ruling** ("it just looks out of
place; weekly is what matters most there"). `hud.lead` is still computed and
deliberately unpainted, so restoring it is an element, not a formatter.
⚠️ **THAT IS NOT AN EXCEPTION TO §0.-13.A.** The rule is that the graded number
does not MOVE between the surfaces that show it, not that every surface shows it.

### D. ⚠️ "NOT EVERYONE GOT FIREWORKS" — the suppression asked the wrong question

Both writers fired correctly. The **suppression** was wrong:

```
if (goals.weeklySeconds > 0 && statsData.secondsWeek >= goals.weeklySeconds)
    weeklyGoalCelebrated = true;
```

*"Is the total already past the goal"* is true for the **entire remainder of the
week.** So a crossing that failed to fire at the moment it happened was gone
permanently — and the plainest way to fail at that moment is `goals.weeklySeconds`
still being 0 because the class read has not returned and the child started
typing immediately.

⚠️ **A WEEKLY GOAL IS CROSSED EXACTLY ONCE PER WEEK, SO ONE MISSED MOMENT IS THE
WHOLE WEEK.** The daily goal carried the identical defect invisibly for as long,
because it re-arms every morning.

`hud.js` v1.4.0's latch records what was actually SHOWN, keyed to the period. A
child who crosses in School and misses it gets it in Library, once.
⚠️ **localStorage ON PURPOSE** — per-browser, so a second Chromebook may show it
twice. That is the correct direction to fail. **Never move this to Firestore: a
celebration is not a grade and must not cost a read.**

### E. ⚠️ FOUR HAND-MAINTAINED TWINS IN ONE DAY — this is the day's real lesson

| Twin | How it failed |
|---|---|
| `mergeGuestStats()` | same defect in both files; §0.-12 |
| `applyGoalCelebrationState()` | open-coded **twice inside `learn.js` alone** |
| the ⚙ and ↺ furniture | anchored differently on each page |
| the celebrations | drifted in three details nobody chose |

The celebration drift is the instructive one because **none of it was a bug
anyone would file**: School burst a fixed 80 particles against Library's 60–100,
School's particles never shrank as they faded (`p.size` vs `p.size * p.life`),
School's toast had no entrance animation. That is what drift looks like before it
becomes a defect.

⚠️ **AND IT HAD A CONCRETE COST THE SAME EVENING.** Jake asked for bigger
fireworks. With two copies that is two edits and the second is forgotten. It is
now `SHELL_COUNT` in `celebrate.js`, and the harness asserts neither writer has
re-grown a local copy.

⚠️ **ROADMAP ITEM 9 IS NO LONGER TIDYING.** "Reduce the surface" is the day's
finding, not a nice-to-have.

### F. ⚠️ A LESSON ABOUT MOCKUPS, RECORDED BECAUSE IT COST A ROADMAP ITEM

Round 26 drew a preview of the new bar, crammed eight elements into the Adventure
row, and it wrapped so a ✓ landed on a third line. Jake said *"checkmark on
adventure can go next to the time — it doesn't need its own row."* **That was a
bug report about the preview.** It was written into ROADMAP 0c.3 as a design
question needing a ruling, and sat there across several exchanges before Jake had
to explain what he had actually meant.

⚠️ **WHEN A DRAWN PREVIEW AND THE SHIPPED CODE DISAGREE, FEEDBACK ON THE PREVIEW
IS FEEDBACK ON THE PREVIEW.** Ask which one the person is looking at before
recording it as a ruling. The shipped ✓ has always been part of the string
`hudStrings()` builds, inline with the time, one element.

### G. ✅ "I'M DONE" SHIPPED (Round 26g, ROADMAP 0d — item 0 is now closed)

`receipt.js` v1.0.0 + `handleImDone()` in both writers. File the open sprint or
run, take a `final` flush, read the week, draw a stamped library date-due card.
**Both halves already existed and were already called on every other exit path;
this is a third caller, not new machinery.**

⚠️ **IT IS A RECEIPT AND THE RULES ARE THE DESIGN.** Never labelled "Save"; no
confirm, no nag, no warning for skipping it; never the only way out; nothing
anywhere gates on it. **A child who never presses it loses nothing.**

⚠️ **THE FAILURE MODE IS NOT A CRASH — IT IS THE BUTTON SLOWLY BECOMING
LOAD-BEARING.** Relabelled "Save", given a confirm-on-exit, promoted to the
primary action, wired into something that branches on it. None of those would
break a test that only checked the flush fires, which is why
`tests/done-button-test.mjs` asserts the *wording and the shape* as well. That is
unusual for this suite and it is deliberate.

What it buys beyond reassurance: it **manufactures the deliberate exit §3.1 says
does not exist** (it does NOT fix the unflushed-tail gap — it gives every child a
way not to be in it), and it **closes the open sprint**, so the drill-down
matches the day total instead of dropping the tail under the five-second floor.

⚠️ `tabindex="-1"`, mouse only — item 8's Tab hazard, solved the other way round
because the child is IN the drill when the bell rings. Inside `#user-info`, so
guests never see it. Re-entrancy guarded and released in a `finally`. A failed
read still draws the card, marked short, because showing nothing after a
successful flush reads as "it didn't work".

### H. What was NOT done
- ⚠️ **The trophy on the landing page — MOVED OUT OF ITEM 0, NOT CLOSED WITH
  IT.** `index.html` has no leaderboard and `openLeaderboard()` lives in
  `game.js`. A feature, not a button. It now stands as its own roadmap entry so
  item 0's closure does not quietly swallow it.
- **A settings panel for School (ROADMAP 0b).** ⚠️ **AND THIS ROUND CREATED THE
  DEBT** — `#user-class-name` was removed from the School bar on Jake's ruling,
  so class information now lives NOWHERE on that side while Library's menu shows
  it. 0b is where that gets paid.
- ⚠️ **NOTHING HERE WAS SEEN RENDERING.** Every layout change this evening was
  written blind and verified by Jake in a browser, which is how the stray `</div>`
  was caught. `style.css` has three consecutive versions (v3.5.1/2/3) that were
  each fixing the previous one's HUD layout, written by rounds that COULD see the
  screen. Ask him to look.

---

## §0.-11. ⚠️ ROUND 25 (Hall) — THE ID IS THE DATE, AND A CUTOVER AUDIT THAT CAME BACK CLEAN

**2026-08-21. The day before the cutover.** That fact chose this round's work
more than the roadmap did.

### A. What was wrong

`lessons-admin.js`'s Students roster panel read each `typing_logs` document and
took its day from `data.date`, the field the writer stamped inside it.
`reports.html` does the same read three clicks away and carries this above it,
in capitals:

> ⚠️ p.date, NOT data.date. The pair drives the point read, so it is the date
> this document was FETCHED under; data.date is whatever the writer stamped
> inside it and **has been wrong before**. The gate must key off the id, like
> the read did.

Two staff surfaces, one collection, opposite rules. ROADMAP item 9 recorded the
disagreement and rated it **"Not urgent."**

⚠️ **THAT RATING WAS CORRECT AND IT EXPIRED TONIGHT.** Before the cutover a wrong
date only mis-sorts a row and mis-files a week. From 2026-08-22 the same string
also picks the READ BRANCH. A post-cutover document read under a pre-cutover date
goes legacy-first, and on a **mixed** day — a morning written flat by a page that
had not picked up the new build, an afternoon written per source — legacy-first
returns the morning ALONE and drops the afternoon.

⚠️ **AND MONDAY'S VERIFICATION LIST POINTS AT THIS EXACT PANEL.** ROADMAP says:
*"The Students roster panel in the lessons admin still shows real weekly minutes.
Near-zero means `lessons-admin.js` v1.13.0 did not reach the browser."* With the
defect live there were **two** explanations for a low number and no way to tell
them apart from the chair. Shipping the fix first removes one of them. **That is
the whole argument for doing this today rather than next week.**

### B. The fix, and the two things about it worth keeping

`_logDateFromId(id)` → the `{uid}_{date}` suffix, or `''`.

1. ⚠️ **ANCHORED AT THE END OF THE STRING, NOT SPLIT ON `_`.** A Firebase uid may
   legally contain an underscore. Google sign-in happens not to produce one, and
   *happens not to* is not a thing to key a grade off. `split('_')[1]` on
   `uid_has_underscores_2026-08-24` returns `'has'`, which is not a date, does not
   match the cutover, and sorts below every week boundary — a whole student
   silently leaving the school week. `/_(\d{4}-\d{2}-\d{2})$/` cannot do that.
2. ⚠️ **THE TOTALS EXPRESSION IS UNTOUCHED.** The date is computed *before* it and
   handed in under the same variable name, so `daylog-cutover-test.mjs` Part G
   still lifts the block byte-for-byte and its seven parity assertions against
   `daylog.js` did not move. **If you refactor here, keep the lift working** —
   Part G's own comment says how.

Falls back to `data.date` when the id will not parse: an unknown id shape means
fail toward *nothing changed*, the same house rule as `daylog.js`'s
missing-`dateStr` branch.

⚠️ **WHAT THIS DOES NOT FIX, AND CANNOT.** The query above it is
`where('date', '>=', sinceDate)` — on the FIELD, because **an id is not an
indexable field**. A document whose stamp is wrong can therefore still fail to be
DISCOVERED at all, and no amount of correct dating afterwards recovers it. This
round makes the documents that arrive read correctly. It does not make arrival
sound. ⚠️ Do not write "the roster panel is immune to a bad date stamp" anywhere.

### C. ⚠️ THE CUTOVER AUDIT — DONE, CLEAN, DO NOT REPEAT IT

The above was found by auditing the cutover on its eve. **Everything else came
back sound.** Recorded so Round 26 spends its time elsewhere:

| Checked | Result |
|---|---|
| Every copy of the cutover constant in shipped code | Three — `daylog.js`, `reports.html`, `lessons-admin.js`. All `2026-08-22`. No fourth. |
| A fifth reader nobody updated | None. `admin.js` and `staff-admin.js` never touch `typing_logs`; `session-log.js` mentions it only in comments; `index.html` reads it **through `daylog.js`**, so it inherits the gate. |
| `readWeek()` passing the date to `totalsOf()` | Yes, per day, from the id it fetched by. |
| The ⟳ recalc write on a post-cutover day | Date-gated (`reports.html` v2.24.0). Writes both per-source triples and `deleteField()`s the flat one. Correct. |
| The manual SAVE box, which is **not** gated | Deliberate, and the reasoning at the call site is sound — ⟳ asserts *where time came from*, the box asserts *the total*. Its known hazard (an open student tab adding on top) is documented and accepted. **Not a defect. Do not "fix" it.** |
| Per-source counters resetting at the midnight rollover | Both files, both triples. `game.js` ~L2783, `learn.js` ~L1905 (with its documented `= 1` compensation). |
| `STAT_KEYS` / the guest-merge fold including the per-source triples | Yes, both, with the incident that required it written above them. |
| Mixed old/new builds across the cutover | Degrades safely. An old writer reads flat and writes flat; the "missing `dateStr` takes the old path" branch is what makes this true. ⚠️ `update-gate.js` is the lever if a stale tab is ever suspected — bump `settings/appVersion.nonce`. |

### D. ⚠️ THE FONT PICKER WAS ASKED FOR AND DEFERRED ONE WEEKEND

Jake asked, 2026-08-21: *"Is it time to do the font choice and any other piddly
things like that?"* Answer given: **the piddly things yes, the font picker no,
and the reason is the calendar rather than the feature.**

The picker lands in `game.js` and `learn.js`. Those are the two files whose
counting behaviour changes at the cutover, and Monday's verification list is a
set of observations ABOUT them. Re-uploading both tonight would put *"and both
counting files changed the night before"* into the middle of that observation —
the exact variable this round spent its day removing from the roster panel.

⚠️ **THIS IS NOT THE `learn.js` WRITE-PATH HOLD.** That rule is about student
write paths and a font picker writes no counters; citing it here would be
borrowing authority from a rule that does not apply. The argument is narrower and
expires sooner: **when Monday's list is green, do the picker first.**

⚠️ **AND IT IS NOT A GENERAL LICENCE TO FREEZE THINGS.** Two piddly items DID
ship tonight, both outside those files, and the test is exactly that — does the
change land somewhere Monday's observation depends on?

- `lessons-admin.js`'s header: `v1.13.0`'s entry had been pasted into the MIDDLE
  of `v1.11.0`'s sentence, cutting it off at "reports.html" and orphaning the
  paragraph that finished it. ⚠️ **That is what `audit:versions` "out of order"
  was actually reporting** — a destroyed sentence, not a sort problem. Worth
  knowing next time it says that about a different file.
- `package.json` declared **`//scripts` twice**. JSON takes the last of a
  repeated key, so the array explaining `npm test` and `--with-epubs` was
  discarded by every parser that ever opened the file — a comment that had been
  deleted for as long as anyone had been reading it. Merged.
- ⚠️ **AND A TRAP IS NOW WRITTEN DOWN IN `package.json` ITSELF:** every harness
  run prints `MODULE_TYPELESS_PACKAGE_JSON` and recommends adding
  `"type": "module"`. **Do not.** `functions/index.js` is CommonJS and is what
  `main` points at, so it breaks the next `firebase deploy` on a `require()` the
  warning never mentions. The noise is cheaper than the cure.

`audit:versions` still reports 14 problems, nearly all of them header budget in
`game.js` (373 lines / 31 entries) and `learn.js` (321 / 34). Both frozen until
after Monday. That is ROADMAP item 9, and it is a real round's work.

---

### E. ⚠️ THE SCHOOL LINK — DIAGNOSED TO A MECHANISM, NOT YET TO A CAUSE

Jake, 2026-08-21: *"Somehow, none of my kids are in my school on the website,
even though they're all in my classes."*

**The mechanism is certain.** `reports.html`'s class dropdown filters on:

```js
if (schoolId !== '__all__' && (c.schoolId || '') !== schoolId) return false;
```

A class whose `schoolId` is blank — or which does not EXACTLY equal a school
document's **id** — is filtered out of every named school and survives only under
"All schools".

⚠️ **AND "All schools" IS WHERE A SUPER ADMIN LANDS BY DEFAULT.** It is the first
option and nothing moves the selection off it (`if (!isSuper() && visible.length)
schoolSel.value = visible[0]` — supers are excluded). **That is why this is
invisible to the one person who can see everything and would be obvious to a
building admin.** It also explains the shape of the complaint exactly: the
classes are fine, the kids are in them, and the CLASS→BUILDING link is the thing
missing.

⚠️ **WHICH OF THREE CAUSES IT IS CANNOT BE DETERMINED FROM THE CODE**, and the
house rule for that is to go and look rather than reason forward from the most
plausible one:
1. no `schools` documents exist at all;
2. classes carry a blank `schoolId` (the rules permit it for a super admin —
   `isSuper() && request.resource.data.schoolId is string`, **and `''` IS a
   string**, so the guard is in the UI only);
3. classes carry a `schoolId` that is not any school's document id — e.g. a
   NAME rather than an id, or a second school document.

**`school-audit.html` v1.0.0 answers it in one click.** Read-only: four
collections, a verdict, and a panel measuring what a repair CANNOT reach.

⚠️ **THE PART A REPAIR CANNOT REACH IS THE POINT OF SECTION 4 OF THAT PAGE.**
`typing_logs.schoolId` is stamped at write time by `game.js`/`learn.js` from the
user document, falling back to the class. Fixing a class today changes what is
written tomorrow and **nothing already stored** — and the lessons-admin Students
panel queries `typing_logs` BY that field. So a corrected class can still show an
empty roster panel for its history. Decide deliberately whether that matters
before anyone "fixes" it and declares victory.

⚠️ **NO REPAIR BUTTON, ON PURPOSE.** A bulk write to `users` on the night before
the source-split cutover, on a diagnosis nobody had confirmed, is not a thing to
do. Look first, repair Monday.

### F. ⚠️ THE DRILL FILTER AND THE FONT — SHIPPED, AND THREE THINGS TO KEEP

Both went into `learn.js` v2.23.0 on Jake's call, under one condition: *"if you
think you can make them without touching the timing mechanism, do it."*

⚠️ **THAT CONDITION IS NOW A TEST, NOT A PROMISE.** `drill-filter-test.mjs` **F7**
brace-matches the five new/changed functions and asserts none mentions a counter,
timer or flush. ⚠️ **The first version of F7 split the file on `/\nfunction /` and
was WRONG** — bodies bled into what followed and it flagged `renderMap()`, which
legitimately both calls the picker and paints a time on the map. *A render
function displaying a number is not a render function computing one.* "Do these
two words appear near each other" is not the question; brace-matching by name is.

**1. ⚠️⚠️ THE RULING CHANGED TWICE IN ONE MORNING AND THE SECOND CHANGE REVERSED
ONE OF ITS OWN EXAMPLES.**

> 1. *"ass is bad alone, but it is fine to randomize to lass or asse or mass."*
> 2. *"maybe make it so ass can't lead the word in the four letter clump. Fass is
>    fine, but asse would probably get it."*

Three matchers in one morning: substring (v1.0.0, wrong), whole-group (v1.1.0,
part 1), **leading (v1.2.0, part 2 — live)**. `asse` was named ACCEPTABLE in part
1 and is BLOCKED under part 2.

⚠️ **DO NOT "FIX" THAT BY PREFERRING THE OLDER QUOTE.** It is Jake looking at the
consequence of his own rule and narrowing it. B4 is annotated as the reversal for
exactly this reason. **When a ruling is amended, the amendment is the ruling —
and the superseded example is the thing most likely to be mistaken for a bug.**

⚠️ **AND THE AMENDMENT FIXED SOMETHING NEITHER OF US SPOTTED IN PART 1.** Under
whole-group matching a three-letter entry could not fire at groupSize 4 at all —
so **the original report, a student seeing "ass", was not covered by the fix
written for it.** I had written that up as a deliberate edge and documented it as
working-as-intended. It was a hole, and Jake's instinct closed it without either
of us framing it that way. ⚠️ *A defect I have explained is not a defect I have
justified.*

**AND THEN A THIRD TIME.** Jake: *"Ass is in real, nonoffensive words. I can't
think of a single word that has fuck in it. [...] all of the other words should
be on a NEVER USE list."* So `ass` is matched LEADING and everything else
ANYWHERE. ⚠️ **Three matchers in one morning, each narrower than the last.** The
module header holds all three quotes and Part B asserts the final state, because
the failure mode here is a future round finding one quote and "restoring" it.

⚠️⚠️ **AND THE COST WAS MEASURED BEFORE ADOPTING, WHICH PAID FOR ITSELF
IMMEDIATELY.** The table showed `fuk` — an entry *I* invented, not a word anyone
types — costing **80% of the filter's entire budget** on the key set most
students are on, because f/u/k are all early keys while `fuck` proper needs a
late `c`. Deleted. ⚠️ **That is the SECOND entry to do this, after `kkk`, and
neither was visible by reading the list.** The generalisable rule: **a short
entry made of early keys is expensive, and the expense is invisible except by
measurement.** Part A prints a per-entry table every run for exactly this reason.

⚠️⚠️⚠️ **THE HOLE WITH TEETH IS IN `learn.js`, NOT `game.js`, AND I HAD BEEN
POINTING THE WARNING AT THE WRONG FILE.** `word_list`, `sentence_list` and
`passage` are step types built from REAL ENGLISH, in the same switch statement as
the two random generators this module guards. A future round reading "the drill
filter lives in learn.js" could wire it into all six, and the only symptom would
be words quietly missing from lessons. Part G measures it: **39 of 42 ordinary
words destroyed** — `title`, `constitution`, `soldier`, `sweet`, `speech`,
`parse`, `grape`, `raccoon`, `manuscript`, `hello`. **G3 asserts `safeGroup()` is
called exactly twice**, counting code and not comments (the first draft counted
both and read 4 — *a guard a comment can trip is a guard people learn to
ignore*).

**2. ⚠️ `kkk` WAS IN THE SLUR TIER FOR AN HOUR AND A FAILING TEST THREW IT OUT.**

It is a SUBSTRING rule and `k` is a home key, so it fired on ordinary same-finger
repetition — `kkkl`, `akkk` — more often than the defect the module was written
for, silently suppressing a legitimate exercise. **A short tier-2 entry made of
common keys is a pedagogy bug wearing a safety costume.** ⚠️ The general lesson is
bigger than the entry: **a content filter's cost is paid in the thing being
filtered, and nobody notices, because the evidence is what is missing.** A1 and C7
are the guards. Do not put it back.

**3. ⚠️⚠️ A PROPORTIONAL FONT BROKE A GUARANTEE `style.css` DID NOT KNOW IT WAS
MAKING — AND THIS IS THE MOST REUSABLE FINDING OF THE DAY.**

The comment above `.dt-char` promises state classes *"change color only, never
dimensions, so every character is always the same width."* Three lines below it,
`.dt-fixed` and `.dt-dirty` set `font-weight: bold`. **The promise held only
because the font was monospace**, where bold has the same advance width. Add a
proportional face and a character going bold the instant a child backspaces and
retypes shoves the rest of the line sideways under their fingers, mid-drill.
`style.css` v3.6.0 swaps bold for an underline while a proportional face is
active. **The comment is now accurate rather than lucky.**

⚠️ **Generalise it:** an invariant written in a comment can be true for a reason
the comment does not state, and a change that looks cosmetic can remove that
reason. When adding a knob, ask what the old code was quietly relying on.

**4. ⚠️⚠️ THE FONT PICKER SHIPPED INVISIBLE, AND THAT IS THE MOST INSTRUCTIVE
FAILURE OF THE DAY.**

Jake, after the upload: *"Dumb question - where is the font changing tool?
There's no settings on the learn page."* It was there. It rendered. It was
attached to the right element and it was idempotent and it applied correctly.
It was 0.75rem in `#777` under the lesson counter with no affordance, because I
had written in the CSS that it should be *"deliberately quiet — it is a
preference, not a call to action."*

⚠️ **A CONTROL NOBODY CAN FIND HAS NOT SHIPPED.** "Quiet" is not a defence for a
feature whose entire content is *a child choosing something*, and if the teacher
who commissioned it cannot find it, no twelve-year-old will.

⚠️⚠️ **BUT THE REAL DEFECT IS THE TEST SUITE, NOT THE CSS.** This round wrote 57
assertions and every one of them was about the FILTER. Not one asked whether the
other half of the work was on the screen. The round had a render bug and a green
suite at the same time, and only a human opening the page caught it.
**"The code runs" and "a person can find it" are different claims, and only the
first one had a test.** Part H is the second claim: jsdom renders `learn.html`,
builds the control, and asserts it exists, attaches to the map, is idempotent,
carries an affordance, and clears a VISIBILITY FLOOR — at least 0.8rem, and a
border, so it reads as a control rather than a caption. v3.6.0 sat below that
floor, which is exactly why it was invisible.

⚠️ **AND A SECOND, SMALLER LESSON FROM FIXING IT.** F11 asserted the font
variable appeared in the CSS exactly ONCE, as a proxy for "the HUD never gets
it". The visibility fix added a legitimate second use — the "Aa" glyph, which
should preview the chosen face — and the test went red on a correct change.
**A count is not an invariant.** It now checks WHICH selectors take the variable
and names the HUD, keyboard and modal as forbidden.

⚠️ **AND WHILE IN THERE:** `body::before` still read `"v3.5.5"` after the v3.5.6
edit, so the build footer had been under-reporting `style.css` by a patch. It is
the only machine-readable copy and nothing compared it to the header. **F12 does
now.**

⚠️ **NEVER WIRE THE FILTER INTO `game.js`.** Library's text is real books, where
every entry on the list is a legitimate word. F5/F6 hold that.

### G. THE CSV ROLLOVER — CONFIRMED PRESENT, ANSWERED FROM THE CODE

Jake asked whether a student already in a class would be offered a move or would
"vanish into the night". **It exists**, `lessons-admin.js` v1.10.0, and the
answer is neither vanish nor silent move: the preview shows a decision block —
*"What should happen to students who already have a class?"* — with **Commit
LOCKED** until one of two radios is chosen (`_csvOverwriteMode` is deliberately
not defaulted). ⚠️ The mode governs BOTH paths — students the roster can see and
students queued to `pendingClassAssignments` by email — because applying it to
only one half would make the behaviour depend on which side of the 45-day log
window a student happened to fall on. That was the v1.10.0 defect.

---

### H. ⚠️ ROUND 24 SHIPPED WITHOUT A CHANGELOG ENTRY

`CHANGELOG.md` has one `## Round` heading and it is Round 23's. Round 24 shipped
`game.js` v3.37.0/3.38.0, `learn.js` v2.21.1/2.22.0, `daylog.js` v1.4.0 and a
`reports.html` bump, and wrote all of it into this file instead. ⚠️ **That is the
same pressure ROADMAP item 9 is about** — the header budget and the CHANGELOG
exist so history stops accumulating in the document people have to read to work.
This round did not reconstruct Round 24's entry: doing it from the outside risks
writing a plausible history rather than a true one. **Round 24's changes are
described in §0.-10; if anyone can confirm the list, it belongs in `CHANGELOG.md`.**

⚠️ **THE PER-FILE SECTIONS OF `CHANGELOG.md` ARE ALSO STALE** — its
`lessons-admin.js` section still says `Current: v1.7.1` for a file that was at
v1.13.0 before this round. Noted, not fixed; a bulk reconciliation is a round of
its own and is worth less than it looks.

---

## §0.-10. ⚠️⚠️ ROUND 24 (Monotype) — LATE IS NOT LOST, AND THE EVENING GUEST

**2026-08-20, late afternoon.** Three shipped files, one new harness, two pins.
`npm test` → **36/36, 0 unregistered.** `audit:versions` → 15 problems (baseline
15), zero "one of the two is a lie."

### 0.-10.A ⚠️⚠️ THE MOST IMPORTANT THING IN THIS SECTION IS A RETRACTION

**ROADMAP item 1 has been wrong for two rounds, and so was §0.-9.F.** Jake
re-generated 2026-08-20 about thirty minutes after typing. Two things recorded
as MISSING were present:

| | Round 23 recorded | Round 24 observed |
|---|---|---|
| the 12:57 PM Library sprint | absent from the drill-down | **1m 8s · 89 WPM · 504 ch, present** |
| the 2:05 PM sprint's daily log | 11m 40s / 2,781 ch | **12m 40s / 3,337 ch** |

Both arrived on their own, one visit late. That is `game.js` v3.25.0's own
documented behaviour — the queue drains on the next page that runs a flush — and
it was written down in the file the whole time.

⚠️ **A REPORT GENERATED MINUTES AFTER A PERIOD IS NOT YET THE RECORD.** Every
conclusion this project has drawn from a freshly-generated report is suspect,
and at least two rounds built work on one. **Before calling anything missing,
look again later.** It is the cheapest rule in the repo and it would have saved
a round.

⚠️ **AND NOTE WHERE THE EVIDENCE CAME FROM.** Round 23 asked Jake to run a
console command to split two candidates. He instead did the obvious human thing
— pressed the button again — and that settled more than the console command
would have. The instrument you reach for first is not always the cheap one.

### 0.-10.B ✅ WHAT SHIPPED

| File | Version | What |
|---|---|---|
| `session-log.js` | **v1.6.0** | `sessionLogAdopt()` prefers the record's own local `date`; the UTC slice survives only for the undated legacy migration |
| `learn.js` | v2.21.1 → **v2.22.0** | Cmd/Ctrl+R reaches the browser; then the School rescue |
| `style.css` | **v3.5.6** | `.text-btn` legible: #ccc, 13px, hover background, focus ring |
| `tests/adopt-date-test.mjs` | **NEW** | 13 assertions, **4 failing against v1.5.0** |
| `tests/run-all-tests.mjs` | v1.6.0 | registers it |
| `tests/session-merge-test.mjs` | v1.6.1 | version pin only |
| `tests/open-unit-test.mjs` | v1.2.3 | version pin only |
| `adventure.css` | **v1.0.1** | the `.text-btn` tint that ate the Logout fix (§0.-10.D) |
| `daylog.js` | **v1.4.0** | `carryOverPlan()` / `carryOverPayloadFor()` (§0.-10.G) |
| `game.js` | **v3.37.0** | `carryGuestDaysToTheirOwnDocuments()` (§0.-10.G) |
| `tests/carryover-test.mjs` | **NEW** | 40 assertions, both guards mutation-verified |
| `tests/guest-merge-test.mjs` | v1.1.0 | C4, C5, C7 assert the property, not the spelling (§0.-10.K) |
| `learn.js` | **v2.22.0** | the School half of the rescue; item 3 deleted (§0.-10.G, §0.-10.J) |
| `game.js` | v3.37.0 → **v3.38.0** | the midnight straddle (§0.-10.L) |
| `tests/midnight-test.mjs` | **NEW** | 23 assertions; both halves mutation-verified |

⚠️ **UPLOAD ORDER: `session-log.js`, then `daylog.js`, then `game.js` and
`learn.js`.** Both shared modules before EITHER page controller — v3.37.0 and
v2.22.0 both import `carryOverPlan`, `carryOverPayloadFor` and `sourceTotalsOf`,
and a missing export throws on import and renders **nothing at all**. ⚠️ This is
the first round in a while where getting the order wrong breaks BOTH modes
rather than one.

⚠️ **UPLOAD `session-log.js` FIRST**, same as Round 23 — `game.js` and `learn.js`
both import from it.

### 0.-10.C ⚠️⚠️ THE EVENING GUEST — A UTC DATE ON A LOCAL RECORD

`sessionLogAdopt()` recomputed each record's date from `at.slice(0, 10)`, and
`at` is `new Date().toISOString()` — **UTC**. America/Chicago crosses UTC
midnight at **7:00 PM** local (6:00 PM outside daylight saving). So a guest
typing at home after dinner, then signing in, got:

* their **daily log** on today, written by the merge in local terms — correct;
* their **sprint record** on tomorrow — wrong.

That is the drill-down-versus-total split this project has been chasing for
three rounds, arriving from a direction nobody was looking. It also blinds
`sessionLogPendingSeconds(uid, dateStr)`, which matches on `date`, so a flush
between two unit boundaries writes a total short by that sprint.

⚠️ **THE RECORD ALREADY CARRIED THE RIGHT ANSWER AND THE MODULE'S OWN HEADER
SAID SO.** `_write()`'s note reads *"`date` IS THE CALLER'S, NOT ours… an undated
record is refused outright rather than guessed at."* `sessionLogAdopt()` was the
one path in the file that overrode a date the caller had supplied. It was written
for the one-time `ttb_wal_v2` migration, where records genuinely had no date and
deriving one was the only option; Round 23 then routed the **guest handover**
through it, and the guest handover's records are dated. A function acquired a
second caller with different needs and nobody re-read its contract.

⚠️ **WHY NO CLASSROOM TEST COULD EVER HAVE CAUGHT IT.** Ellis runs 8am–3pm
Central, where the local and UTC dates always agree. Every guest-handover test
Jake has run passes on a build carrying this defect. **It is a Library-at-home
defect and it exists only because children use TypeThatBook in the evening.**

⚠️ **IT IS NOT THE CAUSE OF THE 2:03 PM CASE** in §0.-10.E. 2:03 PM Central is
19:03 UTC on the same date. Two different faults on one path — Rule 10.

### 0.-10.D ✅ TWO SMALL ONES, AND THE FIRST IS NOT WHAT IT LOOKS LIKE

**You could not hard-refresh in School and you could in Library.**
`handleDrillKey()` has a modifier guard in front of its `preventDefault()` and
**nowhere else**. Cmd+R arrives as `e.key === 'r'`, length 1, walks past that
guard into the printable-character branch, and hits the unconditional
`e.preventDefault()` at the bottom of the typing path: **the refresh is
cancelled AND an `r` is typed into the drill and scored.**

⚠️ **`game.js` IS NOT BETTER WRITTEN HERE, IT IS LUCKIER.** It cancels nothing
for a modifier combo, so the page reloads before its own stray `r` can matter.
The reload is the only reason its version of this bug is invisible. The two
handlers are near-duplicates that have drifted, and they disagree elsewhere too
— ROADMAP item 9.

⚠️ **THE FIX RETURNS RATHER THAN SKIPPING THE CANCEL**, and the difference is the
scored character. Shift is deliberately not in the modifier list: Shift+A is how
a child types a capital, and the lessons drill exactly that.

**The Logout nobody could find — and it was invisible TWICE.** Jake reported
*"there's no logout in library/game"* and attached screenshots with `(Logout)`
visible in three of them, at `#999` / 12px on a black bar beside a bold white
name. `style.css` v3.5.6 fixed that. He then reported it was *"completely
invisible in adventure mode"* — and it was, for a **different reason, in a
different file**: `adventure.css` line 249,
`body.view-adventure .text-btn { color: rgba(43, 34, 26, 0.6) }`. Dark brown at
60%, correct on parchment, near-black-on-black in the only place the class is
ever used — **and three lines below it sits a comment declaring the HUD bar is
deliberately NOT skinned.** The rule reached into the one region the file
promises not to touch, and it silently ate the `style.css` fix. Deleted;
`adventure.css` **v1.0.1**.

⚠️ **TWO STYLESHEETS, ONE INVISIBLE CONTROL, AND THE SECOND ONE WOULD HAVE MADE
THE FIRST FIX LOOK LIKE A FAILED DEPLOY.** `game.html` line 44 and `learn.html`
line 37 are the only users of `.text-btn` in the whole repo — so a skin rule
targeting the class could only ever have hit the HUD. **A control nobody can
find is a control that does not exist**, and this one had been there for rounds
while a test protocol worked around it.

### 0.-10.E ✅ CLOSED BY §0.-10.H — THE GUEST SPRINT'S RECORD

⚠️ **THIS SECTION WAS WRITTEN AS "STILL OPEN" AND WAS RESOLVED LATER THE SAME
EVENING.** Jake drove the whole path in the console and every step worked; the
2:03 PM record was late, like the other two. It is kept because the arithmetic
below is still the clean proof that the MERGE works, and because the two
candidates it names are the right ones to check if this ever recurs. **Read
§0.-10.H before acting on anything here.**

The merge is **proven working**, from the header alone:

| Time | Daily | |
|---|---|---|
| 2:02:10 | 10:34 | signed in, before signing out |
| 2:02:59 | 0:01 | signed out, guest |
| 2:04:24 | **11:40** | signed back in, **before typing anything** |

10:34 + 1:06 = 11:40, and the modal put the guest stretch at exactly 1m 6s. Jake
read the shortfall in the report as "we lost the guest minute"; the arithmetic
says the guest minute landed and the *last* minute was merely late. **Two
different absences that looked like one.**

**But no ~2:03 PM row ever appeared in the drill-down**, and unlike the other two
it has not turned up late. The 2:05 PM row reads `1 runs`, so it was not swept in
with the following flush either.

⚠️ **DO NOT GUESS BETWEEN THE CANDIDATES.** Type as a guest in Library for a
minute and, **before signing in**, run:

```js
JSON.parse(localStorage.getItem('ttb_sessionq_v1') || '{}')
```

* an `owners` key of `"\u0000guest"` holding a record → it queued, and the loss is
  in the handover (`sessionLogTake` → `sessionLogAdopt` → `flushAll('guest-retroactive', true)`).
* no such key → `logSession()` never pushed, and the fix is in `game.js`: either
  the sprint never closed or the five-second floor refused it.

⚠️ Jake's own account of the test: he typed continuously and finished a fable
each time but is **not sure a completion screen appeared**. The 2:02:59
screenshot shows a guest "Sprint Complete" at **0m 1s**, which the floor
certainly refused. Neither candidate is eliminated.

### 0.-10.G ✅⚠️ THE OVERNIGHT RESCUE — JAKE OVERTURNED A STANDING RULING

**Jake, 2026-08-20, verbatim:** *"If Kid A types a bunch but loses connection and
comes in tomorrow, I want him to be able to rescue that time. It wouldn't be
cheating, as it would get picked up and put in the right place. I'm not sure how
that would be a bad thing."*

⚠️ **THE RULING THIS OVERTURNS WAS IN THE REPO AND IT WAS CORRECT.**
`stats-wal.js`'s guest-accumulator header: *"⚠️ DATE-STAMPED AND DROPPED ON A NEW
DAY. Yesterday's guest minutes must not be silently credited to today — a
teacher's daily report is the one thing that has to mean what it says."* Every
word of that still holds. **It assumed the only available destination was
today's counter** — which was true when it was written and stopped being true
the moment Round 23 gave a guest's sprints a dated, sourced, 21-day queue.
`typing_logs` is keyed `{uid}_{date}`, so the right day is addressable.

⚠️ **THE GUEST ACCUMULATOR'S 24-HOUR DROP IS UNCHANGED AND MUST STAY.** It feeds
the LIVE counter, where "yesterday's seconds land on today" is exactly the wrong
answer. The rescue does not touch it. **Two mechanisms, two destinations** — the
accumulator owns today, the queue owns the days that are over.

| File | Version | What |
|---|---|---|
| `daylog.js` | **v1.4.0** | `carryOverPlan()`, `carryOverPayloadFor()` — pure, no clock, no storage |
| `game.js` | **v3.37.0** | `carryGuestDaysToTheirOwnDocuments()`, called after the flush |
| `tests/carryover-test.mjs` | **NEW** | 40 assertions; mutation-verified on both guards |

**Why it cannot inflate a grade, structurally rather than carefully:**
1. the input is **closed sprints only** — the open tail is not in the queue, so
   the rescue is always *less* than what the child typed;
2. `sessionLogTake()` is atomic, so a second sign-in finds nothing;
3. a guest's time has never reached `typing_logs` under any uid, so there is
   nothing to double.

**The failure direction is UNDER-crediting a child**, which is the one to have.

⚠️⚠️ **PRE-CUTOVER DAYS ARE REFUSED AND THAT IS THE §3.1 GUARD, NOT A GAP.**
Before `SOURCE_SPLIT_CUTOVER` a day's time is in the SHARED flat triple, and
adding to it is read-modify-write on a field the other page also writes — §3.1
with an addition in front of it. After the cutover the target is this page's own
per-source field, which no other writer may name, so the add is safe by
construction and needs no lock. **The rescue therefore switches itself on with
the cutover** and can never run against the shape it would corrupt.
⚠️ `carryOverPayloadFor()` **throws** on a pre-cutover date rather than falling
back to the flat triple. Do not "fix" that.

⚠️ **IT IS LIBRARY-ONLY. `learn.js` IS NOT WIRED** — ROADMAP item 2b. The shared
machinery is source-agnostic and the School side is already covered by the
harness; what is missing is six lines in `retroactiveSaveAnonSession()`. Held
back under the standing rule that a write-path change to the file 8th grade
depends on ships in a round that can watch School run. **Ship it with item 3**;
they touch the same function.

### 0.-10.H ✅ THE GUEST PATH, DRIVEN RATHER THAN READ

Jake ran the whole thing in the console. First time in the project's history.

| Step | Result |
|---|---|
| chapter completed as a guest | `[["\u0000guest", 1, ["102s 2026-08-20"]]]` |
| navigating away mid-sprint | queues — `pagehide` fires |
| sign-in | `Adopted 1 guest sprint record(s) into fuHvKkVj…` |
| after the flush | `[]` |

So the 2:03 PM record was **late, not lost** — §0.-10.A, for the third time in
one round.

⚠️ **ONE THING DID NOT FIRE.** Cmd+Tab to another application did NOT trigger
`visibilitychange`; macOS fires it on occlusion, not on focus loss. `pagehide`
covers the case that matters, so nothing is lost — but the comment above the
`visibilitychange` handler claims broader coverage than it has, and a future
round must not lean on it.

⚠️ **AND A FIRST READING WAS WRONG BECAUSE THE QUESTION WAS WRONG.** The first
console check returned `{}` and looked like a smoking gun. It was taken mid-
sprint, when an empty queue is the CORRECT state — the queue is only written
when a sprint ends. **Ask for the reading at a moment when the answer means
something**, or you will get a true answer to a question nobody asked.

### 0.-10.J ⚠️⚠️ ROADMAP ITEM 3 WAS A PHANTOM, AND THE WAY IT GOT THERE MATTERS

**Jake asked "why not fix the learn.js while we're in there?" The answer turned
out to be: because there is nothing to fix.**

Item 3, written in Round 23 as §0.-9.G and carried into two roadmaps, said:

> `learn.js`'s `_flushStatsInner()` opens only `if (!currentUser) return;` — and
> a guest is signed in **anonymously**, so `currentUser` is not null. A guest in
> School therefore writes `typing_logs/{anonUid}_{date}`: a real document under
> a uid no roster can attribute.

⚠️ **`signInAnonymously` APPEARS NOWHERE IN THIS REPOSITORY.** Not in `game.js`,
not in `learn.js`, not in `index.html`, not in any HTML shell. There is no
anonymous auth and there never has been. A guest has `currentUser === null`, the
guard has always caught them, and **no orphan document has ever existed.**
Firebase does not mint an anonymous user by itself; it requires that call.

⚠️ **HOW IT HAPPENED, WHICH IS THE USEFUL PART.** Both files are full of
`!currentUser || currentUser.isAnonymous` tests. Round 23 read two of them side
by side, noticed one file's guard was shorter than the other's, and inferred the
*state* the longer guard described. **A defensive guard is evidence that somebody
was being careful, not evidence that the case occurs.** The inference was made
from reading code rather than from establishing a fact, which is the identical
failure §0.-9.E warns about in capitals one section below — and this round
scheduled work against it before checking.

⚠️ **THE CHEAP RULE: GREP FOR THE MECHANISM BEFORE WRITING DOWN THE
CONSEQUENCE.** "A guest is signed in anonymously" is one `grep` away from being
settled either way. It cost two rounds because nobody spent it.

⚠️ **DO NOT "FIX" THIS BY ADDING ANOTHER `isAnonymous` GUARD.** It would be
harmless code that enshrines a false belief for the next instance to inherit —
which is exactly what happened here. If anonymous auth is ever switched on, this
whole area wants a real review, not another guard.

⚠️ **AND CHECK THE GUEST BRANCH AT `learn.js` ~2805 IF IT EVER IS.**
`if (currentUser && countsAsTime) … else if (!currentUser && countsAsTime)` — the
second branch is the one that fills `anonLessonProgress`, which is what
`retroactiveSaveAnonSession()` replays into the real account. It is live and
correct **because `currentUser` is null for a guest**. Turn anonymous auth on and
that branch goes dead, and a guest's completed lesson grades stop reaching their
account. That is a real defect waiting behind a config flag, and it is the
opposite of the one item 3 described.

### 0.-10.K ⚠️ THREE ASSERTIONS IN ONE HARNESS WENT RED FOR PROSE

`guest-merge-test.mjs` C4, C5 and C7 were all defeated by Round 24's edits
without a single behaviour changing: C4 and C5 required a literal nested
`sessionLogAdopt(user.uid, sessionLogTake(GUEST_QUEUE_UID)`, which had to become
a local so the rescue could plan from it before the flush; C7 used a
500-character proximity window that a comment block pushed the flush outside of.

All three now lift the function body and assert **order** — taken before
adopted, adopted before flushed. **v1.1.0.**

⚠️ **A SOURCE-TEXT ASSERTION SHOULD HOLD THE PROPERTY, NOT ONE WAY OF WRITING
IT.** A proximity window in characters is the worst version of this: it makes
documenting your own change a test failure, which teaches the next round to
write less of the thing this project runs on.

### 0.-10.L ✅⚠️ ROADMAP ITEM 6 — THE MIDNIGHT STRADDLE, CONFIRMED AT LAST

**Two rounds looked at this and could not name a culprit. The reason is that
both numbers were right.**

The observation (§0.-5.I, real data 2026-08-20): a session rollup of **4m 9s at
12:00 AM** beside a daily log of **0m 6s** for the same date.

A sprint running 11:56 PM → 12:00:09 AM is split correctly by the day counters —
they tick second by second, and when `getLocalDateStr()` turns over the tick
resets them and starts writing tomorrow's document. **243 seconds to yesterday,
6 to today. Exactly right.** But `sprintSeconds` knew nothing about midnight and
kept climbing, so when the sprint ended `logSession()` filed **one** record of
249 seconds, stamped with the day it **ended** on.

249 = 4m 9s. 6 = 0m 6s. The incident, to the second.

⚠️ **THE ROADMAP'S SECOND CANDIDATE IS INNOCENT AND MUST NOT BE INVESTIGATED
AGAIN.** "`session-log.js`'s own dating of a chunk" is not it — that module dates
from the caller and always has. The caller was handing it a sprint that had
already crossed midnight. ⚠️ Round 24's `sessionLogAdopt()` fix (§0.-10.C) is a
**different** date defect on a **different** path; the coincidence of finding two
date bugs in one round is not evidence they are the same one.

**The fix** closes the open sprint on the outgoing day before the reset, reusing
`logOpenSprint()` — the machinery that already handles navigating away
mid-sprint. `logSession()` gains a `dateOverride` for this **one** caller, which
still honours the oldest rule in the project: the caller dates the record,
because the caller is the only thing that knows these seconds belong to
yesterday.

⚠️⚠️ **AND THE MIDNIGHT CHECK MOVED ABOVE `sprintSeconds++`. THAT ORDERING IS
HALF THE FIX.** One line lower and the second that just elapsed — the first
second of the new day — is filed under yesterday. Off by one, every midnight,
forever, invisible. `midnight-test.mjs` **B4** is that mutation and it is the one
a reviewer would wave through.

⚠️ **THE FIVE-SECOND FLOOR IS THE RESIDUE AND IT IS THE RIGHT ONE.** A sprint
begun at 11:59:58 has two seconds to close; the floor refuses them and
deliberately does not advance the watermark, so they roll into the new day rather
than vanishing. Two seconds on the wrong side of midnight beats two seconds gone.

⚠️ **LIBRARY ONLY. `learn.js` IS NOT FIXED** — the full recipe is in ROADMAP
item 6. Its tick increments **before** its rollover check and compensates with
`= 1` instead of `= 0`, so mirroring means moving the block past
`anonSecondsAccum++` and `armAnonLoginPrompt()` in the file 8th grade depends on.
**Exposure decided it, not symmetry:** School runs 8am–3pm and a lesson does not
straddle midnight; Library at home does. `midnight-test.mjs` **Part D asserts the
gap on purpose** — invert those two when School is done, do not delete them.

### 0.-10.M ⚠️ THE HARNESS CAUGHT ITSELF DOING THE THING §0.-10.K IS ABOUT

`midnight-test.mjs` B4 went **red against correct code** on its first run. The
fix's own comment block explains that the close must precede `sprintSeconds++` —
so the phrase appears in PROSE above the line it describes, and `indexOf` found
the comment first.

**Fourth variant of the same failure in one round**, after `guest-merge-test.mjs`
C4, C5 and C7. The block is decommented before the search now.

⚠️ **AN ASSERTION THAT READS COMMENTS IS MEASURING THE DOCUMENTATION, NOT THE
PROGRAM** — and in a repo whose comments are this dense, that is not an edge
case, it is the default. **Strip comments first. Assert order, not distance.**

### 0.-10.F WHAT WAS DELIBERATELY NOT DONE

* ~~**ROADMAP item 3 and item 2b.**~~ Both resolved after Jake pushed back on the
  hold — 2b shipped (`learn.js` v2.22.0), item 3 **deleted** (§0.-10.J).
  ⚠️ **THE HOLD WAS RIGHT TO EXIST AND WRONG HERE**, and the distinction is
  worth keeping: the rescue cannot execute before the cutover, so it was inert
  on the school day after the deploy **by construction**. That is a property of
  this change, not a licence for the next `learn.js` edit.
* **The header budget.** `learn.js` went 297 → 303 lines and 32 → 33 entries,
  `game.js` 352 → 363 and 29 → 30, `daylog.js` 92 → 101; `session-log.js` is now
  over the entry budget as well as the line budget. All knowingly. The audit
  still reports **15 problems, the same count as before the round**. ROADMAP
  item 9.
* **Nothing was done about the late flush itself.** It is not obviously a defect
  — the records arrive — and "flush more often" trades Firestore writes for a
  teacher seeing numbers two minutes fresher. §0.-9's `HIDDEN_FLUSH_MIN_GAP_MS`
  comment already priced that at about $1/year against $85. Measure item 5 first.

---

## §0.-9. ⚠️⚠️ ROUND 23 (Empire) — THE GUEST MINUTE, AND A THEORY THAT WAS WRONG

**2026-08-20, afternoon.** ⚠️ **STUDENT WRITE-PATH ROUND.** Five shipped files.
`npm test` → **35/35, 0 unregistered.** `audit:versions` → zero "one of the two
is a lie."

### 0.-9.A ⚠️⚠️ THE DEFECT, IN JAKE'S OWN NUMBERS

One student, one machine, cache cleared, both modes:

| | guest total | after sign-in | server held |
|---|---|---|---|
| **School** (`learn.js`) | 1:04 | **8:31** | 7:27 |
| **Library** (`game.js`) | 1:11 | **8:31** | 7:27 |

7:27 + 1:04 = 8:31 — School merged the guest minute. Library landed on the
**same 8:31**, the server's own figure, so its minute was overwritten. The next
signed-in sprint took it 8:31 → 9:39, which the report confirms at 9m 39s /
1,633 chars.

⚠️ **THE CAUSE WAS AN ABSENCE, WHICH IS WHY NOTHING COULD GREP FOR IT.**
`learn.js`'s `onAuthStateChanged` calls `retroactiveSaveAnonSession()` **before**
`loadUserStats()`. `game.js`'s went straight to `loadUserStats()`, and
`applyWeekToStats()` is by its own header **AN ASSIGNMENT, NOT AN ACCUMULATION**
— it wrote the server's number over the guest's counter.

⚠️ **AND `game.js` DID HAVE THE MERGE — TWICE, INLINE, IN TWO MODAL PATHS.** The
"Nice work!" prompt merged. The start-modal merged. The header **Sign In**
button — three lines long, on screen at all times, the obvious one — did not.
**Whether a child kept their minutes depended on which of three buttons they
pressed.** Two copies of a rule are not the defect; the third caller that has
neither is.

### 0.-9.B ✅ WHAT SHIPPED

| File | Version | What |
|---|---|---|
| `game.js` | **v3.36.0** | `retroactiveSaveGuestSession()` — ONE copy, all three callers, **before** `loadUserStats()`. Guest sprints queued, not dropped |
| `learn.js` | **v2.21.0** | `logRun()` stops filing guests under the anonymous uid; adopts the guest queue; **logout reloads** |
| `session-log.js` | **v1.5.0** | per-owner queue store, `GUEST_QUEUE_UID`, `sessionLogTake()` |
| `reports.html` | **v2.25.0** | the reconcile and rebuild DELETED (§0.-9.D) |
| `tests/run-all-tests.mjs` | v1.5.0 | two harnesses deregistered, two added, fixture exempted |
| `tests/guest-merge-test.mjs` | **NEW** | 11 failing against v3.35.0/v2.20.0 |
| `tests/queue-owner-test.mjs` | **NEW** | 8 failing against session-log.js v1.4.0 |
| `tests/real-sessions-fixture.mjs` | **NEW** | the only real production session data in the repo |

⚠️ **UPLOAD `session-log.js` FIRST.** `game.js` and `learn.js` both import
`sessionLogTake` and `GUEST_QUEUE_UID` from it, and a missing export throws on
import and renders **nothing at all**. Shared module first, always.

### 0.-9.C ⚠️ THE THREE FIXES ON THE GUEST PATH, AND WHY EACH IS SEPARATE

1. **The merge.** `retroactiveSaveGuestSession()` in `game.js`, mirroring
   `learn.js`. ⚠️ **IT RUNS BEFORE `loadUserStats()` AND MUST STAY THERE** —
   it merges, then *flushes*, so the read that follows reads back the merged
   figure. Move it after and the assignment wins again.
   `guest-merge-test.mjs` Part B asserts that ORDER, which is the thing a
   future edit will get wrong.
2. **The record.** A guest's sprints go to `GUEST_QUEUE_UID`'s slot and are
   adopted at sign-in. Jake's requirement verbatim: *"As a flush so it's in the
   record, too."* Without this the day's total would be right and the
   drill-down would still be short — which **is the shape of ROADMAP item 1's
   real case**, and is now a named candidate for it rather than a mystery.
3. **Logout.** `learn.js` signed out without reloading, so a signed-out School
   page kept painting `Daily 8:31 / 10:00 · Weekly 59:12 / 50:00` — goal
   denominators and all. Under Rule 11 that is the worst kind of wrong number:
   a child reading a total that is not theirs. It reloads now, like `game.js`.

⚠️ **`sessionLogTake()` TAKES RATHER THAN READS, ON PURPOSE.** A handover
interrupted half-way loses the tail instead of adopting it twice. Losing a
guest's unlogged tail costs one sprint's detail; adopting it twice inflates a
graded number. That is the direction to fail in.

### 0.-9.D ✅ THE RECONCILE IS GONE — JAKE CONFIRMED THE BOUNDARY

`reports.html` **v2.25.0**, ~830 lines: `runReconcile()`, `renderReconPanel()`,
`reconCellsHtml()`, `readPairSessions()`, `unionSprintSeconds()`,
`uidIndexMap()`, `buildRebuildPlan()`, `renderRebuildPreview()`,
`runRebuildAll()`, `localToday()`, the Sessions / Δ / ⧉ / ⏱ Clock columns, their
notes panels, and the CSS. Jake, asked directly: *"As long as you agree none of
it is necessary, you can make all those cuts without impacting students at all."*

**Kept:** Generate, the CSV, the drill-down and its ⧉ badge, the per-day editor
and its SAVE box, and ⟳ on a single day.

⚠️ **TWO THINGS THE CUT NEARLY BROKE, AND THEY ARE THE LESSON:**
* **`runPool()` is used by Generate**, not only by the reconcile, and it read
  `RECONCILE_CONCURRENCY` and `reconCancel`. Cutting by function name would
  have left Generate throwing. It has its own `POOL_CONCURRENCY` now.
* **`recalcDailyLog()`'s `expect` option** became dead the moment the bulk
  rebuild went — its only caller was `runRebuildAll()`. Removed with its branch.

⚠️ **THE REAL SESSION DOCUMENTS WERE LIFTED BEFORE THE DELETION**, into
`tests/real-sessions-fixture.mjs`, which ROADMAP item 2 required in as many
words. `reconcile-test.mjs` and `union-clock-test.mjs` are deleted in the same
commit — **and the registration audit caught the attempt to remove only one
half**, which is that audit earning its keep for the second time.

### 0.-9.E ⚠️⚠️ THE PART A FUTURE INSTANCE SHOULD ACTUALLY READ

This round spent most of its length on a theory that was **wrong**, and the way
it went wrong is more useful than the fix.

`session-log.js` stored the queue under one key holding one uid, and `_write()`
had no ownership guard, so a second account's first push destroyed the first's
unflushed records. That is **true**, it is proven by
`queue-owner-test.mjs`, and it **cannot happen at Ellis** — every student logs
into the Chromebook with their own account, so per-browser is per-person.

⚠️ **THAT RULING WAS ALREADY IN THE REPO, IN `stats-wal.js`'s OWN HEADER**:
*"THIS IS THE ONE PLACE A SHARED MACHINE STILL MATTERS. See learn.js
checkpointOwner() for the ruling: every student at Ellis has their own account,
so per-browser is per-person."* I read that file top to bottom in the same
session and then asked Jake to run a classroom test to establish a fact he had
already written down. He had to say it twice.

**The rules that would have caught it, and are cheap:**
1. ⚠️ **BEFORE ASKING JAKE FOR GROUND TRUTH, GREP THE REPO FOR IT.** His
   rulings are recorded precisely so they stop being relitigated (§0.-7.A). A
   question you can answer from a file is a question you should not be asking.
2. ⚠️ **A MECHANISM IS NOT A CAUSE.** "This code could lose data" and "this is
   what lost Jake's data" are different claims. Rule 10 exists for the gap.
3. **The correction was worth more than the theory.** Asking *which two uids
   can actually meet on one profile* — the question left once shared machines
   were ruled out — led straight to guest-vs-signed-in, which is the real
   defect and needed no facts about the building at all.

⚠️ **THE PER-OWNER STORE IS KEPT AND IS NOW LOAD-BEARING FOR A DIFFERENT
REASON.** The guest slot and the account slot must exist at the same moment for
the handover in §0.-9.C to be possible. It stopped being a fix for a case that
cannot occur and became the mechanism for one that does.

### 0.-9.F ⚠️ STILL OPEN — LIBRARY SESSION RECORDS

In Jake's 2026-08-20 test, the drill-down showed School rows at 8:47, 9:00,
12:51 and 12:52 and **nothing from the Library typing at 12:55–12:57**, even
though that minute reached the daily total (8:31 → 9:39). The guest half of that
is explained and fixed. **The signed-in minute is not.** `logSession()` should
have fired at Sprint Complete.

**Do not guess between the two candidates — they are different fixes.** After a
Library sprint, before navigating, run `sessionLogPending(<uid>)` in the
console: non-zero means it queued and did not flush; zero means it never queued.

### 0.-9.G ⚠️ FOUND, NOT FIXED — learn.js FLUSHES FOR ANONYMOUS USERS

`game.js`'s `_flushAllInner()` opens `if (!currentUser || currentUser.isAnonymous)
return;`. **`learn.js`'s `_flushStatsInner()` opens only `if (!currentUser) return;`**
— and a guest is signed in *anonymously*, so `currentUser` is not null. A guest
in School therefore writes `typing_logs/{anonUid}_{date}`, which is a real
document under a uid no roster can attribute.

**Not fixed this round, deliberately.** It loses nothing — the student's own
document is correct via the merge — and it is orphan noise rather than a wrong
grade. It is a one-line change to the file 8th grade depends on, and it was not
demonstrated in Jake's test. **Fix it in a round that can watch School run.**

### 0.-9.H WHAT WAS DELIBERATELY NOT DONE

* **The 60-line header budget** on the six shared modules. `session-log.js` is
  back inside the **6-entry** limit; the line budget is untouched everywhere.
  The audit went 16 problems → 15. ⚠️ `game.js` (352 lines, 29 entries) and
  `learn.js` (297, 32) got worse, knowingly — the guest-minute notes were worth
  the lines. ROADMAP item 7.
* **ROADMAP items 3, 4, 5, 6.** Items 4 and 5 wait on the cutover week.

---

## §0.-8. ✅ §3.1 IS CLOSED — THE WRITERS SHIPPED, AND THREE THINGS TURNED UP WHILE DOING IT

**Round 22 (Smith Premier), 2026-08-20 afternoon.** ROADMAP items 1 and 3, done.
⚠️ **THIS IS A STUDENT WRITE-PATH CHANGE.** Six shipped files, five harnesses.

### 0.-8.A ⚠️ JAKE'S RULES DEPLOY LANDED AND IT IS CORRECT

`firestore.rules` **v2.6.0 is in the repo and in the right place.** The
`resource == null` clause is FIRST on `typing_logs`, ahead of both clauses that
dereference `resource.data`, mirrored pre-emptively onto `typing_sessions`, and
correctly *not* applied to `practice_sessions` (staff-query-only, no by-id
reader). Executed against the emulator: **54 + 18 = 72 assertions green.**

⚠️ **THAT FIX HAD NO HARNESS, AND NOW IT DOES.** `rules-probe.test.mjs` **v1.1.0
Part D** drives a full seven-day week read including a Saturday, a Sunday and a
day that has not happened yet — the exact shape `daylog.js readWeek()` makes —
plus the other half of the property: a stranger still learns nothing about a
document that *does* exist. **Proven red against the v2.5.0 clause order** by
deleting the null clause and re-running: 4 failing, then green when restored.

⚠️ **WHAT PART D IS REALLY ASSERTING IS CLAUSE ORDER**, which nothing else in the
repo can see. Every clause after the null test dereferences `resource`, so any
reordering reinstates the incident **silently, with the app still appearing to
work** — the page falls back to a live counter and the number on screen stays
plausible. That is how it survived to reach ninety children.

### 0.-8.B ✅ WHAT SHIPPED

| File | Version | What |
|---|---|---|
| `daylog.js` | **v1.3.0** | `SOURCE_FIELDS`, `sourceTotalsOf()`, `dayLogPayloadFor()`; `readWeek()` returns `todaySources`. **`totalsOf()` UNTOUCHED.** |
| `stats-wal.js` | **v1.1.0** | per-source counters in `DAY_COUNTERS`. Storage key unchanged. |
| `game.js` | **v3.35.0** | writes `secondsLibrary`/`charsLibrary`/`mistakesLibrary` only. Stale header fixed. |
| `learn.js` | **v2.20.0** | writes the School triple only. Stale header fixed. |
| `reports.html` | **v2.24.0** | `recalcDailyLog()` date-gated; cutover constant hoisted out of `generateReport()` |
| `lessons-admin.js` | **v1.13.0** | the fourth reader, date-gated |
| `tests/tab-lifetime-test.mjs` | **v2.0.0** | B, C, F assert the CORRECT totals; new Part I |
| `tests/crossmode-overwrite-test.mjs` | **v2.0.0** | rewritten onto per-source FIELDS |
| `tests/daylog-cutover-test.mjs` | **v1.1.0** | Part G: `lessons-admin.js` parity |
| `tests/rules-probe.test.mjs` | **v1.1.0** | Part D: the null-resource incident |
| `tests/session-merge-test.mjs` | **v1.6.0** | the dead v3.33.0 HUD reset is now asserted ABSENT |

**`npm test` → 35/35. `npm run test:rules` → 72 passing.**
**`audit:versions` → zero "one of the two is a lie".**

### 0.-8.C ⚠️⚠️ THE WRITERS ARE DATE-GATED, AND THE ROADMAP DID NOT SAY SO

ROADMAP item 1 assumed the deploy day *is* the cutover day. **It is not.** The
upload lands on a non-school evening; the cutover is Saturday 2026-08-22.

⚠️ **EVERY READER IS LEGACY-FIRST BEFORE THAT DATE.** A page that started writing
`secondsLibrary` on the 21st would file that whole afternoon in a field every
reader in the app ignores, and the day would read as the morning's stale flat
number. **So the gate is on the writer too**, in `daylog.js dayLogPayloadFor()` —
**one `if` in the entire app** decides which shape a day is written in, and both
pages pass their cross-mode counter AND their per-source counter into it so the
choice of counter and the choice of field cannot disagree.

**Consequences worth knowing:**
- The upload is **safe on any day of the week** and changes nothing until Saturday.
- A machine that misses the deploy is merely **old**, not at odds with the new shape.
- ⚠️ **§3.1 IS STILL LIVE FOR THE DAYS IN BETWEEN.** `tab-lifetime-test.mjs`
  Part D and `crossmode-overwrite-test.mjs` Part D **assert that defect on
  purpose.** Do not "fix" them. It is bounded by the calendar.

### 0.-8.D ⚠️ THE ⟳ BUTTON WOULD HAVE THROWN, NOT MERELY LOST DATA

ROADMAP item 3 was right that `recalcDailyLog()`'s `deleteField()` calls become
a data-loss button after the cutover — the split fields *are* the day by then.
Gated: before the cutover, byte-for-byte v2.23.0; after it, the day comes back as
the two per-source triples out of `splitSessionTotals()` **and the flat triple is
deleted**, because ⟳ asserts "this day equals its sessions" and the sessions
cover the whole day including any flat morning. That also makes the result
correct under **both** branches of `readLogTotals()`.

⚠️ **BUT THE GATE DID NOT COMPILE INTO A WORKING BUTTON.**
`SOURCE_SPLIT_CUTOVER` was declared **inside `generateReport()`'s scope**.
`recalcDailyLog()` is a sibling function outside it. The gate parsed fine and
would have thrown a `ReferenceError` on the first click, with nothing on screen
to explain it. **Found by `undefined-calls-test.mjs`, which is exactly the class
of defect that harness exists for.** The constant now sits at the top of the
script. ⚠️ **ONE DECLARATION ONLY** — a second one anywhere in that file lets the
read path and the write path disagree about the date with nothing to notice.

⚠️ **THE PER-DAY EDITOR'S SAVE BOX IS DELIBERATELY *NOT* GATED.** The two buttons
assert different things: ⟳ says *this day equals its sessions*, which is a claim
about where the time came from and must be filed per source; the SAVE box says
*this day was N minutes, because I was in the room*, which is a claim about the
total with no claim about the mode. Writing N into the frozen flat field and
clearing the splits says exactly that, and after the cutover the reader sums, so
the day reads as N. **Known and accepted:** a student tab left open across the
edit still flushes its own counter on top. That hazard predates the cutover —
the same tab used to overwrite the correction outright — and no client-side
change removes it.

### 0.-8.E ⚠️ `lessons-admin.js` WAS A FOURTH READER AND NOBODY HAD COUNTED IT

`daylog.js`, `reports.html` and `index.html` all learned the cutover in v2.22.0.
**The Students roster panel in `lessons-admin.js` has its own legacy-first copy
of the totals rule and did not.** From Saturday it would have shown a roster of
students with a week of nearly nothing while `reports.html`, three clicks away,
showed their real minutes.

⚠️ **THE PROBLEM IS THAT THERE ARE THREE HAND-MAINTAINED COPIES OF ONE RULE**,
and the reason is the same each time: three standalone pages that cannot import
each other. `daylog-cutover-test.mjs` **Part G now lifts this third copy too** and
drives it against `daylog.js` on identical inputs, so all three are held to one
behaviour **by execution rather than by anyone remembering**. Parts F and G
together are the only mechanical guard on that trio.

**The lesson to carry:** when a rule is copied, the copies are found by asking
*who else reads this collection* — not by grepping for the rule, which only finds
the copies that already agree with you.

### 0.-8.F ⚠️ THE WAL TRADE, STATED PLAINLY BECAUSE IT IS A REAL NARROWING

Before v1.1.0, a School tail stranded in the shared stats WAL could be flushed by
a **Library** page, because both pages wrote the same `seconds` field and either
could push the other's number. **That is over.** Each page writes only its own
triple, so a Library page recovering `secondsSchool` has nowhere to put it. The
value is kept and carried — a later School page flushes it — but it is no longer
true that any page can drain the whole record.

**This is the smaller loss and it is deliberate.** What the old behaviour bought
was the tail of the other mode, bounded by one flush interval and recovered the
next time that mode is opened. What it cost was that either page could write the
other's minutes, **which IS §3.1** — unbounded and permanent. ⚠️ **Do not "fix"
this by letting a page write the other's field when it looks larger.** That is
§3.1 with a comparison in front of it.

⚠️ **THE STORAGE KEY IS UNCHANGED ON PURPOSE.** A v1.0.0 record has no per-source
keys; `_mergeInto()` skips absent keys, so it still replays its `secondsToday`
correctly and contributes nothing to the new counters. Bumping the key would have
thrown away every unflushed tail in the building on deploy day.

### 0.-8.G ⚠️ HOW THE HARNESSES FAIL AGAINST THE OLD BUILD — THIS IS THE RULE 10 PART

ROADMAP item 1 step 1 required that `tab-lifetime-test.mjs` B, C and F **fail
against the shipped build before anything else moved.** They do, and the
mechanism is worth keeping:

**The controller those parts drive is not chosen by whoever edits the harness.
It is chosen by reading `game.js` and `learn.js`.** If both build their payload
with `dayLogPayloadFor()`, the split controller is live; otherwise the flat one
is. Against a build without the writers, B/C/F drive the flat controller against
the correct totals and go red — **6 of 19 failing**, verified by running the new
harness against the original v3.34.0 files side by side.

⚠️ **THAT INDIRECTION IS LOAD-BEARING, NOT CLEVERNESS.** A model harness that
hard-codes which shape it believes is shipped proves only that its author's idea
is internally consistent. **That is precisely how `crossmode-overwrite-test.mjs`
spent six rounds validating a per-source DOCUMENT design the deployed rules
reject outright.** It is rewritten onto fields, and its Part A — *neither page
may name the other source's fields in a Firestore payload, ever* — is now the
assertion that would notice §3.1 coming back.

### 0.-8.H WHAT WAS DELIBERATELY NOT DONE

* **ROADMAP item 2, removing the reconcile.** Independent of this work, and
  §0.-7.A item 3 still stands: confirm the boundary with Jake before cutting,
  because it shares `reports.html` with the drill-down and the per-day editor,
  which he uses.
* **ROADMAP items 3 (the session record losing work), 4, 5, 6, 7 and 8.**
  Untouched. Item 5 is now measurable — the day after the cutover is the first
  clean `log ÷ sessions` day on the new shape.
* **The idle-threshold rationale as a code comment.** §0.-7.D wanted it folded
  into this deploy. Not done: both headers were already over budget and this
  round added to them. §0.-7.A item 1 remains the record. ⚠️ It is a comment,
  not behaviour — **do not "fix" the 2s/3s constants while adding it.**

---

## §0.-7. ✅ PHASE A COMPLETE — AND JAKE'S RULINGS, RECORDED SO THEY STOP BEING RELITIGATED

**Round 21 (Hammond), 2026-08-20 morning.** ⚠️ **NOTHING IN THIS SECTION SHIPS TO
A STUDENT.** Six files, all test tooling and config. `game.js`, `learn.js`,
`reports.html`, `daylog.js` and `firestore.rules` are untouched.

### 0.-7.A ⚠️⚠️ JAKE'S RULINGS. DO NOT REOPEN THESE.

Each of these has now cost the project a round because it lived in a chat log
instead of a file. **They are settled.**

1. ⚠️ **THE 2s / 3s IDLE ASYMMETRY IS CORRECT AND DELIBERATE.** Jake, verbatim:
   *"in game they know how to type and learn they don't."* Library is for
   students who can already type, so a 2-second gate is right; School is for
   students who cannot, whose keystroke gaps are legitimately longer, so 3
   seconds is right. **It is not a bug, it is not an inconsistency, and it is not
   a violation of "everything should do both."** Round 21 raised it as a defect
   (§0.-6.C) and was wrong. ⚠️ **`ROADMAP.md` PHASE C1 IS WITHDRAWN.** Jake added
   that if instances keep reopening it, collapse both to 2.5 — **treat that as
   what it is: an expression of exhaustion at the churn, not a design decision.**
   The right response is to leave the constants alone and stop raising it.

2. ⚠️ **TIME IS A VALID BASIS FOR A GRADE.** Jake: *"Time is a perfectly valid
   way to grade if the practice is legitimate. The goal is to make a tool that
   measures legitimate practice time."* **`ROADMAP.md` §6 D-1 — "stop grading
   minutes, grade chapters instead" — IS REJECTED.** The pedagogy is settled:
   typing a book is excellent practice once a student can type; School exists to
   get them to that point. **The job is to make the minutes legitimate, not to
   stop counting them.** Do not re-propose D-1.

3. **THE RECONCILE TOOL IS TO BE REMOVED.** Jake: *"Torch it. Torch the
   reconcile."* ⚠️ **NOT DONE THIS ROUND AND DELIBERATELY SO** — "Reconcile vs
   Sessions" shares `reports.html` with the drill-down and the per-day editor,
   which Jake **uses** and which are not implicated. Removing the wrong one costs
   him a tool he relies on. **Confirm the boundary with him before cutting.** It
   writes nothing today, so there is no urgency.

4. ⚠️ **THE HISTORICAL DATA IS GOOD ENOUGH AND IS NOT TO BE "REPAIRED."** Jake's
   own account: a previous audit repaired the daily logs each time he ran it, as
   he went. His judgement: *"The time that is currently showing is the real time,
   or it's close enough."* **He is the person with ground truth about what he
   ran, and this is his call to make.** ⚠️ **NO INSTANCE MAY PROPOSE A BULK
   REBUILD OF PAST DAYS.** The remaining exposure he has already accepted is a
   couple of students who typed at home.

5. **CONSOLE TAMPERING → a report-side outlier check, later.** Jake: *"If a kid
   finds that in the console, I find it hard to believe that we couldn't have
   some sort of check in the reports that wouldn't find an obvious overcount."*
   He is right and it is cheap — an implausibility flag in `reports.html`, not a
   rules change. **Roadmap item, not urgent.** Note it needs the log-to-session
   baseline to set a threshold.

### 0.-7.B ✅ WHAT PHASE A SHIPPED

| File | Version | What |
|---|---|---|
| `tests/run-all-tests.mjs` | **v1.4.0** | Three orphans registered; new `RULES` list; **REGISTRATION AUDIT** |
| `tests/tab-lifetime-test.mjs` | **v1.0.0 NEW** | 13 checks. The axis nothing covered. |
| `tests/rules-probe.test.mjs` | **v1.0.0 NEW** | 13 assertions against the real rules |
| `tests/firestore-rules.test.mjs` | **v2.0.0** | 14 red → **54 passing, 0 failing** |
| `tests/README.md` | v1.4.0 | The emulator setup; counts now audit-enforced |
| `package.json` | — | `test:rules`, `test:rules:setup` |
| `firebase.json` | **NEW** | Emulator config only. **Changes nothing about deploys.** |

**`npm test` → ALL 33 HARNESSES PASS.** **`npm run test:rules` → 67 passing.**

⚠️ **THE REGISTRATION AUDIT IS THE PART THAT MATTERS**, not the three lines that
registered the orphans. A harness is only coverage if something notices when it
stops being run, and until now nothing did. The suite now fails on any `.mjs` in
`tests/` that is in no list and not exempted **with a written reason**.

⚠️ **`tab-lifetime-test.mjs` PARTS B, C AND F PASS BY ASSERTING A DEFECT.** They
are green *because* the shipped build loses the time they say it loses. **When
Phase B lands they must be rewritten to assert the correct totals, and must fail
before the writers change.** A green there today is not a green there tomorrow.

### 0.-7.C ⚠️ THREE THINGS FOUND WHILE DOING PHASE A

* ⚠️ **THE TWO RULES HARNESSES CANNOT SHARE ONE `mocha` PROCESS.** Both declare
  root-level hooks that seed and clear the emulator; interleaved, each wipes the
  other's seed and five roster assertions fail with `Null value error` — which
  looks **exactly** like broken security rules. `test:rules` runs two separate
  invocations for this reason. **Do not merge them to save three seconds.**
* ✅ **THE OPEN UNKNOWN FROM §0.-5.G IS RESOLVED, AND IT IS BENIGN.** Split, the
  token-less assertion shows `books/{id}` is `allow read: if true` **on purpose**
  — a signed-out child must be able to open a book before they have an account.
  Student logs and classes are correctly denied. **The old test asserted a policy
  this project does not have.**
* ⚠️ **`firestore-rules.test.mjs` HAD A SECOND WRONG ASSERTION**, unrelated to the
  seed: it created a class with no `teacherUids` and expected success. The rule
  requires a teacher to put themselves on a class they create, or they would make
  a class they cannot then read. **The rule is right.** Both halves are now
  asserted so the requirement is visible.

### 0.-7.D WHAT WAS DELIBERATELY NOT DONE

* **The stale version headers** (`game.js` says v3.30.0, runs 3.34.0). Comment-only
  — but fixing them means re-uploading a **396 KB student file** for a comment.
  ⚠️ **FOLD IT INTO THE PHASE B DEPLOY**, when those files are being touched
  anyway. Not worth a standalone student-file deploy, and certainly not before
  first period.
* **The idle-threshold rationale as a code comment.** It belongs in `game.js` and
  `learn.js` above the constants, and it ships with Phase B for the same reason.
  Until then §0.-7.A item 1 is the record.
* **Removing the reconcile.** §0.-7.A item 3.

---

## §0.-3. ⚠️⚠️⚠️ JAKE'S STANDING RULES 9, 10 AND 11 — THEY OUTRANK EVERY PLAN BELOW

Added 2026-08-19 on Jake's instruction, after this project cost him an evening
for the sixth time. They apply to every project, not only this one. **An
instance that cannot satisfy them must SAY SO and ask Jake to overrule, not
quietly proceed.**

**RULE 9 — SINGLE SOURCE OF TRUTH.** Adding a second record of a quantity that
already exists requires DELETING the first in the same deploy. If the first
cannot be deleted — a security rule, a live index, an API limit — **the round
does not ship the addition. It ships work on the blocker.**

> *Why:* every counting incident in this project traces to one sentence — "the
> rules won't let me remove the old one yet, so I'll add the new one now and
> clean up later." `stats/time_tracking` existed for months because
> `firestore.rules` would not let a student read their own daily log. That was a
> true constraint and the round shipped the second copy anyway. Rule 9 says the
> rule change WAS the round.

**RULE 11 — SACRED, AND IT OUTRANKS RULES 9 AND 10 AND EVERYTHING BELOW.**
The number the student sees and the number the teacher pulls must be the SAME
NUMBER, read from the same record by readers proven identical. No feature ships
if it could let them diverge. ⚠️ **A divergence can live in the QUERY or the
DATE RANGE, not just the arithmetic** — §0.-2 (a UTC date formatter) and §0.-4
(a `classId` WHERE clause) are both proof. Test the query.

**RULE 10 — PROVE IT ON REAL DATA FIRST.** No number becomes a graded or
reported value until a harness exists that FAILS against real production data
before the fix and passes after. **A green suite on synthetic data is not
evidence.**

> *Why:* Round 18 verified every session document against its own `sprints[]`
> and all four corrupt documents passed. Internal consistency is a statement
> about ONE record; the defect lived BETWEEN records. Round 19 then derived a
> grade from those records — Stage 2 — with a fully green suite.
> ⚠️ **`week-agreement-test.mjs` Part B passes with the UTC bug fully present**
> because it runs at local noon. Part C is the same check at all 24 hours and it
> fails. That gap is the whole of Rule 10 in one file.

---

## §0. ⚠️ HOW THIS DOCUMENT WORKS — read before writing a word of it

**There is one handoff. This one. It is amended in place and never forked.**

1. **Never create `HANDOFF-roundN.md`.** Not to archive, not to be safe, not
   because your round was big. GitHub commit history is the archive and it is
   sufficient. A second handoff file is the beginning of nine of them.
2. **Never cite a document that is not in the repo.** Not "see round 8 §4", not
   "the reasoning is in the old handoff". If a claim matters, the claim goes
   *here*, in full, in your own words. If you cannot restate it because you cannot
   read it, then **it is gone, you say so once, and you move on.** Jake has stated
   plainly that he will not go looking, and he is right not to.
3. **Amend, don't append.** When your round supersedes a paragraph, *rewrite that
   paragraph.* Do not add a §7.4 amendment below a §7 that is now wrong. Round 12
   did that and the wrong version stayed on the page.
4. **Bump this file on the `x.y.z` pattern** in the comment block above. Minor for
   a normal round; major only with Jake's sign-off, like any other file.
5. **Delete as you add.** If your round makes a section obsolete, remove it in the
   same commit. This document earns its length only by being the shortest thing
   that is still complete.
6. ⚠️ **INVARIANT NUMBERS IN §5 ARE APPEND-ONLY. NEVER RENUMBER THEM AGAIN.** A
   new invariant takes the next free number and goes at the bottom of its group.
   Round 14 renumbered once, as a repair, and it cost seven file uploads — see §5.
7. **A document a session produces ships in the same commit as the code**, or it
   does not exist. This is the oldest rule in the project (Blick, Round 3) and
   breaking it is what produced the mess this file cleans up.

---

## §1. ⚠️ HARD CONSTRAINTS — these are not preferences

**Jake has no command line.** No `firebase deploy`, no `gcloud`, no emulator, no
`npm` on the machine that matters. He uploads files through the GitHub web portal
and clicks in the Firebase and Google Cloud consoles. **Anything that is not (a) a
file on GitHub or (b) a console click is not shippable.** An entire Auth
custom-claims role system was built across two rounds before anyone asked. That one
constraint explains `firestore.rules` v2.x reading Firestore documents instead of
token claims, and why `functions/index.js` is undeployable.

**Complete replacement files, never diffs or patches.** Every time.

⚠️ **DELIVER THE REPO AS A ZIP, WITH EVERY FILE ALREADY IN THE DIRECTORY IT
BELONGS IN.** `tests/`, `tools/`, `docs/`, `firebase/`, `functions/`, `library/`.
Round 17 spent an evening emptying the repo root and it is not to be refilled by
a lazy delivery. Jake unzips and drags each file to the matching path; a flat
zip makes that a guessing game.

⚠️ **THE DEPLOY / TEST DOCUMENT GOES ALONGSIDE THE ZIP, NEVER INSIDE IT.** Jake's
instruction, 2026-08-19, after a `DEPLOY-ROUND19.md` shipped inside the archive:
he uploads what is in the zip, so anything in the zip is a candidate for the
repo. A deploy note is **scaffolding for one delivery** — an upload order, a
console step, a test script, a delete list — and it has no business in a
repository that already carries `README.md` and `HANDOFF.md` as its permanent
documentation. Present it as a **separate file in the same message**, where he
can read it without unzipping anything.

⚠️ **ANYTHING DURABLE OUT OF A DEPLOY NOTE BELONGS IN `README.md` OR THIS FILE
INSTEAD.** If a step will be true again next round — the weekly grading
procedure, how to fire the update gate, where the version stamps are — it is
documentation, not scaffolding, and putting it only in a throwaway note means
re-deriving it next time.

**Version constants, not header comments.** Each file carries a runtime constant
that renders on the page; the header comment is decoration. `versions.js` parses the
constants out of the deployed files precisely so a stale cached file cannot lie about
its own version. Bump the constant.

- **One bump per shipped release, not per edit.**
- **Never walk a deployed version backwards.** Corrections go forward.
- **Patch (z) for fixes, minor (y) for features, both automatic. Major (x) requires
  Jake's explicit sign-off** — flag it, don't decide it.
- ⚠️ **THREE VERSION PINS EXIST.** `session-merge-test.mjs` and `open-unit-test.mjs`
  Part D both pin `session-log.js`; `hud-test.mjs` pins `hud.js`. Bump either module
  and every pin on it moves in the same commit. Round 14 tripped over this twice in
  one evening, and both times the suite named the miss on the first run. **Grep for
  the version string before bumping a shared module.**

**`npm install` first on a clean container**, then `npm test`. Dependencies are in
`devDependencies` and are not vendored. **Round 10 shipped without running the suite
and took lesson mode down completely**; the harness that already existed named the
defect by file and line on the first run.

**Upload order is load-bearing whenever a shared module is involved.** `game.js` and
`learn.js` both import `session-log.js`, `stats-wal.js` and `hud.js`. A missing module
throws on import and renders **nothing at all** — there is no graceful degradation.
Shared modules go up first, always. Where a writer and a consumer change together,
ship the *consumer* first unless you have reasoned otherwise in writing: an old
consumer silently discards a new field.

**`experimentalForceLongPolling` in `firebase-config.js` is load-bearing.** It fixes
Safari's CORS block on Firestore's WebChannel transport. Not debug leftovers.

**Never retain student-identifying data.** No Skyward IDs, no real names, no
demographics tied to a person. The leaderboard stores initials only and there is no
browsable user directory, by design. `users/{uid}` deliberately holds no PII, which is
*why* the roster is built from `typing_logs` (§3.10).

---

## §2. Where the code is

Shipped state after **Round 34, 2026-08-23**. **Verified by running
`npm run audit:versions`, not copied from the previous table.** (Round 28 ran it;
0 problems.)

⚠️ **ROUND 30 CHANGES HOW YOU VERIFY A DEPLOY, SO READ THIS FIRST.** Before
`versions.js` v1.13.0, the hover panel cached its answer in `sessionStorage` and
**could not be refreshed by reloading** — only by opening a new tab (§0.-22). If
you are checking a deploy from a tab that was open beforehand, **open a new tab**;
from v1.13.0 onward a second hover sixty seconds later is enough.

⚠️ **AND THE SITE IS GITHUB PAGES, NOT FIREBASE HOSTING.** A web-portal commit is
not live immediately, and no cache header can change that. To tell "not deployed
yet" from "cached", fetch the file with a throwaway query string —
`typethatbook.misterwilson.org/versions.js?x=1` — which is a different URL and so
bypasses both the browser and the CDN edge.

⚠️ **ROUND 29: UPLOAD `lesson-gate.js` FIRST.** It is a new shared module and
both page controllers import it; a browser with the new `learn.js` and no
`lesson-gate.js` throws at import time and the page is blank, not degraded. Same
hazard as Round 28's, one file along.

⚠️ **ROUND 28: UPLOAD `firebase-config.js` FIRST.** It is the new home of
`ADMIN_EMAILS` and **five files import it**. A build with the new `game.js` and
the old `firebase-config.js` throws at import time on both student pages.

⚠️⚠️ **THIS TABLE SAT FIVE ROUNDS STALE — IT STILL SAID "ROUND 22" WHILE ROUNDS
23–26 SHIPPED — AND THE PARAGRAPH THAT USED TO BE HERE CLAIMED THE HEADER/
CONSTANT PROBLEM WAS "FIXED".** It was not; it came straight back in Round 26,
in five files at once (§0.-14). Two lessons, both earned:

1. **Run the audit. Do not trust this table.** That instruction was already here
   and was already correct. It is now also enforced — `npm test` fails on a
   lying stamp, so the table cannot drift this far again without the suite
   saying so.
2. ⚠️ **"FIXED" WAS THE WRONG WORD FOR A DEFECT NOTHING WAS CHECKING.** Round 22
   corrected the *instances* and wrote down that the class was closed. Nothing
   prevented recurrence, and four rounds later the recurrence shipped. **A
   corrected instance is not a closed defect until something fails when it comes
   back.**

⚠️ **ROUND 27 CHANGED NO BEHAVIOUR** — five version stamps, one rewritten
harness, one new harness. The interesting deploy note is that `game.js`,
`learn.js`, `hud.js`, `style.css` and `adventure.css` all now report themselves
honestly for the first time since Round 26, which is what Monday's verification
reads.

| file | version |
|---|---|
| `game.js` | **3.45.0** — Round 30: the build panel's own staleness flag is gone. Round 29's active-day counter stands. §0.-22.C, §0.-21.B |
| `learn.js` | **2.35.0** — ✅ Round 34: a lesson opens at the first run that still counts (`firstOpenRunIdx()`); both intro entry points honour it. §0.-26. Round 33:  ✅ Round 33: the goals-cache hit-guard treats an UNASSIGNED entry as a miss (ROADMAP 11, Bug B). §0.-25. Round 32:  ⭐⭐ Round 32: ROADMAP 14. Points per RUN, banked in `recordRunOutcome()`; `practiceRun` armed per run; `lastLockDay` replaces `lastAdvanceDay`. ⚠️ `runScorePill()`/`armRunMode()` have NO coverage. §0.-24. Round 31:  ⚠️⚠️ Round 31: `exitLessonToMap()` — leaving a lesson flushes the RUN, not just the time, and the FLUSH COMES BEFORE THE RELOAD THAT EMPTIES `userProgress`. §0.-23. Round 29's gate and Round 30's panel fix stand |
| `session-log.js` | **1.6.0** — PER-OWNER queue + `GUEST_QUEUE_UID`. ⚠️ UPLOAD THIS FIRST — both pages import from it. Its TWO pins are checked by version-stamp-test.mjs C |
| `hud.js` | **2.0.0** — ⚠️⚠️ MAJOR, JAKE SIGNED IT OFF. The v1.3.0 return-shape break recorded as the major it was. §0.-15. ⚠️ UPLOAD BEFORE THE TWO WRITERS |
| `variety-floor.js` | 1.0.0 |
| `lesson-gate.js` | **1.1.0** — ⭐⭐ Round 32: the run-scoring rule (ROADMAP 14). ⚠️ ARGUABLY MAJOR AND NOT TAKEN — Jake's call. ⚠️ UPLOAD BEFORE learn.js. §0.-24. Round 29:  ⭐⭐ **NEW, Round 29.** The whole of ROADMAP item 10's rule, and it is PURE. ⚠️ **UPLOAD BEFORE game.js AND learn.js** — both import it. §0.-21.A |
| `stats-wal.js` | **1.1.0** — ⚠️ Round 22. Per-source counters in DAY_COUNTERS; storage key unchanged. §0.-8.F |
| `versions.js` | **1.13.0** — ⚠️⚠️ Round 30. The read cache is module state with a 60s TTL, NOT sessionStorage — ⚠️ **do not move it back to storage that outlives a page load.** Round 28's `{ notes }` gate and proportional header budget stand. §0.-22, §0.-20.C/D/F |
| `daylog.js` | **1.4.0** — The shared week reader, the cutover, and `dayLogPayloadFor()` — **the one gate deciding a day's shape**. §0.-8.C. Carries the Overnight Rescue |
| `keyboard.js` | 1.1.1 |
| `adventure-renderer.js` | 1.5.4 |
| `admin.js` | **3.31.2** — Round 28: `ADMIN_EMAILS` imported, no behaviour. §0.-20.H |
| `lessons-admin.js` | **1.14.0** — ✅ Round 33: every class-assignment writer carries `schoolId`, through `_schoolIdForClass()` — the one answerer, with a cold-cache fallback. §0.-25. Round 28:  Round 28: header entries archived, no code. Still dates typing_logs by DOCUMENT ID (Round 25). §0.-11 |
| `staff-admin.js` | 2.2.0 |
| `reports.html` | **2.25.1** — Round 28: `BOOTSTRAP_EMAILS` aliases the shared export. Round 23's reconcile/rebuild deletion stands, §0.-9.D. ⚠️ NOT in the audit's SOURCES — its version is unchecked |
| `update-gate.js` | 1.0.1 — ⚠️ NEW in Round 19. Loaded by its own script tag in both shells, NOT imported. See §0.10 |
| `index.html` | **3.13.0** — Round 30: the build button passes `{ force: true }` — a deliberate press means *right now*. ⚠️ NOT in the audit's SOURCES — its version is unchecked |
| `firebase-config.js` | **1.3.0** — ⚠️⚠️ Round 28. **THE ONLY COPY of `ADMIN_EMAILS`**, down from four, plus `isStaffUser()`. ⚠️ UPLOAD BEFORE game.js, learn.js, admin.js, reports.html AND index.html — all five now import from it. §0.-20.H |
| `firebase/firestore.rules` | **2.6.0** — ⚠️ **Jake deployed this 2026-08-20 and it is CONFIRMED CORRECT BY EXECUTION.** The null-resource clause is FIRST and must stay first. §0.-8.A |
| `style.css` | **3.9.0** — Round 29: `.practice-banner` and `.practice-only`. Round 28's `#footer-full` fix stands. §0.-21.E, §0.-20.A |
| `settings-panel.js` | **1.2.0** — ⚠️ NEW, Round 27c. The SIXTH shared module. ⚠️ UPLOAD BEFORE learn.js. §0.-16, §0.-19 |
| `game.html` | 1.2.0 — ⚠️ div-balance checked this round: 5 open / 5 close in `#hud`, whole file balanced |
| `learn.html` | **1.2.0** — ⚠️ Round 26 fixed §0.-13.B's stray `</div>`. Re-checked this round: balanced |
| `adventure.css` | **1.0.3** — ⚠️⚠️ Round 28. **THE ROUND'S ROOT CAUSE.** Its one unscoped rule, `body footer { opacity:.55 }`, faded the build panel in every view. §0.-20.A |
| `celebrate.js` | **1.1.0** — ⚠️ Round 27 gave it the version constant it shipped without. Now in SOURCES. §0.-15 |
| `receipt.js` | **1.1.0** — ⚠️ Round 27 gave it the version constant it shipped without. Now in SOURCES. §0.-15 |
| `drill-filter.js` | 1.3.0 — ⚠️ Round 25. Now in SOURCES (§0.-15); it always had a constant, nothing watched it |
| `functions/index.js` | 1.7.0 — Cloud Function, NOT deployable from this repo; Jake mirrors it into the console by hand. See its own header. Moved out of the root in Round 17; the file is byte-identical. |

`npm test` → ⚠️ **ALL 35 HARNESSES PASS, 0 PENDING, 0 UNREGISTERED.**
(Round 23: two harnesses added, two deleted with the code they covered.)
`npm run test:rules` → **72 passing** (54 + 18) against the deployed rules.
⚠️ **TWO HARNESS PARTS ASSERT A DEFECT ON PURPOSE** and must not be "fixed":
`tab-lifetime-test.mjs` Part D and `crossmode-overwrite-test.mjs` Part D are the
pre-cutover shape, which is still live until 2026-08-22. `tab-lifetime-test.mjs`
Part E is the v3.29.0 seeding mistake, driven deliberately so it cannot ship
twice. Everything else asserts what a student earned.

Historical note — Round 19 added
`tests/daylog-test.mjs` (28 assertions, five mutation-verified) and **closed the
standing `metadata-map-test` failure that had been carried as acceptable for
several rounds.** It was not a book-metadata question: it was reporting two real
defects in `admin.js` (§6 item 3). **The number to watch is now "0 failing, 0
missing." Anything else is new** — and invariant 54's warning about an accepted
red hiding the next real failure has just been demonstrated the hard way, so do
not re-open one.

**Deploy check, in one glance:** Library footer reads `game.html vX · game.js vX ·
style.css vX` (⚠️ CHANGED IN ROUND 15 — it used to read just `game.js v3.26.2`; if
you see that old single-file format, Round 15's code is not running). Lessons footer
reads the same three-file shape for `learn.html` / `learn.js` / `style.css`. Hover
either footer (tap-to-pin on touch) for the full deployed build, `hud.js` and
`session-log.js` and `stats-wal.js` included. ⚠️⚠️ **THE CORNER `ID xxxxxxxx` STAMP IS GONE (Round 27g), AND SO IS THE DEPLOY
CHECK THAT DEPENDED ON IT.** This paragraph used to read *"if the ID stamp is
missing, the new code is not running and nothing else you check means anything."*
The student ID now lives in **Settings** on both pages — Library's ⚙ menu and
School's ⚙ panel — so its absence from the corner proves nothing.

⚠️ **THE FOOTER VERSION IS THE DEPLOY INSTRUMENT NOW, AND IT IS A BETTER ONE**,
because Round 27 made the version stamps honest and `npm test` fails if one lies
again (§0.-14). Read the footer triad; a wrong or old version there is the
signal. **Do not look for the corner stamp.**

⚠️⚠️ **ROUND 28 CHANGED WHAT THE HOVER PANEL SHOWS YOU, AND YOU NEED TO KNOW
WHICH VERSION OF IT YOU ARE LOOKING AT (§0.-20).**

* **Signed in as staff** — the panel is what it always was, ⚠ notes included,
  and it is now *legible*: before `adventure.css` v1.0.3 it was rendered at 55%
  opacity over the book text and could not be read at all.
* **Signed out, or signed in as a student** — the ⚠ notes are hidden and a grey
  line reads **"N build notes — sign in as staff to read them."**
  ⚠️ **THAT LINE IS THE POINT. A PANEL WITH NO GREY LINE IS GENUINELY CLEAN; A
  PANEL WITH ONE IS NOT.** You will most often read this standing at a student's
  machine signed in as nobody, and the whole design exists so that state cannot
  look like "everything is fine."
* ⚠️ **THE OLD `adventure-renderer.js … stale module cache` LINE WAS FALSE** and
  fired on every classic-mode session since it shipped. If you remember
  discounting it, that instinct was correct and is no longer needed — it now
  only appears when the renderer is actually mounted and actually drifted.
* ⚠️ **`firebase-config.js` IS THE FIRST FILE TO UPLOAD THIS ROUND.** Five files
  import `ADMIN_EMAILS` from it. A browser holding the OLD one against the NEW
  `game.js`/`learn.js` throws at import time — a blank page, not a degraded one.

---

## §3. Architecture — understand these before editing

### 3.1 ⚠️ THE CENTRAL PROBLEM: three documents hold one quantity

| document | written | authoritative for |
|---|---|---|
| `users/{uid}/stats/time_tracking` | every flush | day + week totals (HUD) |
| `typing_logs/{uid}_{date}` | every flush | day totals (reports grade from this) |
| `typing_sessions/*` | unit end, and on hide | nothing — drill-down display only |

**Every counting incident in this project's history is the same sentence: two records
of one quantity, updated on different paths, disagreed.**

⚠️ **AND ROUND 19 FOUND WHY THE SECOND RECORD HAD TO EXIST: `firestore.rules`
gave the student's browser NO READ ACCESS to `typing_logs` or `typing_sessions`,
so the HUD could not display the graded number and was forced to keep its own
copy. Read §0.0.2. Do not spend another round trying to make two copies agree —
that guarantee does not exist. Delete one.** The doubled week counter, the
missing stats documents, the HUD that changed on refresh, the cross-mode overwrite —
all of it.

⚠️ **`typing_logs/{uid}_{date}` is ONE document written by BOTH page controllers, each
from its own in-memory counter.** A student does ten minutes in School, opens Library,
and `game.js` writes 240 seconds over the top of 600. **That is a live data-loss path
today**, in the document the project grades from. Closing it is what §4 is about.

⚠️ **Do not re-gate the stats write on `final`.** Round 11 did, to save ~$85/year.
Result: roughly half of ninety students had no stats document at all, because a `final`
flush needs a deliberate exit and a child closing a Chromebook lid produces none. The
real saving is about $7/year at district scale and it cost the entire week of
2026-08-18.

### 3.2 The write-ahead log

`saveProgress()` used to fire on every `.`/`!`/`?`/newline, writing three documents each
time. Now everything records synchronously to localStorage each sentence and flushes to
Firestore on a timer (`FLUSH_INTERVAL_MS` / `LEARN_FLUSH_MS` = **300000**, five minutes)
and on real boundaries. `walRecover()` replays on the next load; `typing_logs` is a merge
and therefore idempotent under replay.

⚠️ **The WAL does not always survive.** It lives on hardware shared between students. Any
design treating it as a durability guarantee is wrong.

### 3.3 `session-log.js` — records, deltas and the watermark

A session record is one bounded stretch of typing: a Library sprint or a School run.
Records queue in localStorage, grouped by the date they were **typed** (not flushed — a
queue surviving overnight used to collapse yesterday's work onto today), and write in
rollup documents capped at `RECORDS_PER_DOC` = 200.

`logOpenSprint()` (game.js) and `logOpenRun()` (learn.js) close the open unit on
`visibilitychange: hidden` and `pagehide` **without ending it** — counters and
`sprintCharStart` are untouched, so a student who returns and finishes has only the
remainder recorded. This exists because a student who switches books every few sentences
used to produce counter time with *no session history at all*.

⚠️ **BECAUSE ONE STRETCH OF TYPING CAN PRODUCE SEVERAL RECORDS, THE WRITERS EMIT DELTAS
against a watermark of what has already been logged.**

- A zero or negative delta writes nothing and is not an error.
- A continuation carries its **own** recomputed WPM and accuracy. `reports.html` reads
  per-run figures as belonging to the row they sit on, the 🚩 fast-run marker especially.
- `continuation` records are exempt from the 5-second floor. A standalone 3-second run is
  noise; the 3-second tail of a recorded 40-second sprint is the rest of something real.
  A refused *first* record deliberately does not advance the watermark, or the seconds it
  declined would be orphaned.

⚠️ **RESET THE WATERMARK WHEREVER YOU RESET THE COUNTER, IN THE SAME PLACE.** Four such
sites in `game.js`, three in `learn.js`. A new sprint carrying a stale watermark records
**nothing** until it grows past the previous sprint's length — a silent loss, not a
crash. `open-unit-test.mjs` counts the reset sites against the shipped sources.

`flushSessionsNow()` uploads the queue immediately on hide and on navigation, outside the
60-second rate limit, because the queue was previously drained only by a `final` flush and
Reports showed n-1 sessions as a result. It is self-limiting.

### 3.4 ⚠️ `serverAt`, and why nothing reads it

Every date, duration and WPM interval is stamped by the student's own Chromebook clock.
`serverAt: serverTimestamp()` resolves at commit and lands on every `typing_sessions`
rollup. **Nothing reads it. No total derives from it. No panel shows it.** That is the
point: a cheat signal added on the day you need it has no history behind it.

⚠️ **`_stampServer()` HAS NO CLIENT-SIDE FALLBACK AND MUST NEVER ACQUIRE ONE.** A
`serverAt` built from `new Date()` agrees with `timestamp` by construction, so the
divergence is permanently zero — a field certifying "no clock tampering" whether or not
there was any. `session-merge-test.mjs` asserts the absence of a fallback against the
source text.

⚠️ **The dependency is optional on purpose.** `sessionLogInit()` takes `serverTimestamp`
and works without it, omitting the field. Jake uploads one file at a time, so there is a
window where the module is new and a page controller is cached. A *required* dependency
would write `serverAt: undefined`, which Firestore rejects, which fails the whole rollup
write, which loses a period of sprint detail. **A missing dependency costs one field; a
required one costs a period.**

⚠️ **There is no `clientAt` field and adding one would be a defect.** `timestamp` already
holds that value and keeps its name because `reports.html` and a live single-field index
exemption already know it.

### 3.5 ✅ ONE CLOCK — School's two-clock split is CLOSED (Round 14)

**Jake's ruling, 2026-08-18: time typed starts at the first CORRECT keystroke of a
run.** `drillPos` advances only on an accepted character, so `drillPos > 0` is that
moment exactly, and it is now the single gate on both pages.

`startGradedTimer()` in `learn.js` owns the **only** tick in that file, and
`stepSeconds`, `learnActiveSeconds`, `secondsToday` and `secondsWeek` all advance on
consecutive lines inside it. `gameTick()` in `game.js` gates on `lastInputTime` being
set, so a sprint no longer counts the two free seconds it used to grant before the
first keystroke. **Read `startGradedTimer()`'s header before adding anything to it.**

⚠️ **THERE WERE THREE INCREMENT SITES, NOT TWO** — `stepSeconds` under the graded
gate, `secondsToday` in a second interval under an idle-only gate, and a third copy of
that second interval inside `closeGenie()` with `ggBypassIdle` wired differently from
`game.js`. Collapsing them closed four things at once without any being fixed
separately: the first-keypress/first-correct-keypress gap, a hard stop that stopped
one clock and left the other running, the admin No-Idle flag meaning two different
things on the two pages, and the 1s-versus-100ms sampling difference (which retires
`DESIGN-TELEMETRY` step 6).

⚠️ **`learnTickInterval` IS AN ALIAS FOR `timerInterval`, NOT A SECOND TIMER.** Nine
call sites already clear it to stop the clock; aliasing keeps all nine correct rather
than betting they were all found. **Do not "clean up" one of the names without
checking every clear site.**

⚠️ **PAINTING IS NOT COUNTING, AND THE PAINT MUST NEVER BE GATED.** v3.26.0 gated
the accumulator correctly and left the *draw* call inside that gate, so students saw
`game.html`'s hardcoded `Daily 0:00` and an empty `#hud-week` until they typed. Every
number was right the whole time. A gate answers "did time pass?"; drawing answers
"what does the student see?", and the second is never "nothing" because the first is
no. Fixed in v3.26.1 / v2.10.1 and now asserted by Part E.

⚠️ **`hud.js` CARRIES A DISPLAY CACHE OF THE DAY AND WEEK TOTALS, AND NOTHING MAY
SEED `statsData` FROM IT.** Firestore is an async read, so between a page painting
and that read landing the only totals in memory are the initialised zeros — a student
with time banked opened a book and saw `Daily 0:00`. `hudCacheSave()` writes **only**
after the authoritative read; `hudCacheLoad()` returns null rather than stale numbers
if the cache is from another day. **It paints and nothing else.** Seed `statsData`
from it and §3.7's merge baseline gets computed against a number that never came from
the server, which is the doubled week counter rebuilt. Read the header above
`HUD_CACHE_KEY`.

⚠️ **ROUND 15: THE FALLBACK LIVES INSIDE `updateTimerUI()` / `renderTimeHUD()`
NOW, NOT AT ONE CALL SITE.** Round 14 painted the cache seed once in
`loadChapter()`, then called `updateTimerUI()` on the very next line — which
repainted from `statsData`, still zero, stomping the seed it had just drawn.
Separately, the init handler carried a comment claiming a repaint happened
after `loadGoals()` resolved; the call it described had been deleted at some
earlier point without the comment following it. Net effect: nothing painted
real numbers until `gameTick()` started on the first keystroke — Round 14's
fix genuinely did not fix it, and shipped with tests green because
`open-unit-test.mjs` Part E checks for a second *increment* site, not a missing
*repaint*. Fixed by folding the cache-fallback into `updateTimerUI()` itself —
`learn.js`'s `renderTimeHUD()` already worked this way and never had the bug —
so every caller gets it for free, and restoring the actual `updateTimerUI()`
call after `loadGoals()`. **If you ever add a new place that paints the HUD,
call `updateTimerUI()`/`renderTimeHUD()` — do not paint it by hand, and do not
trust a comment that says a repaint happens without finding the call.**

⚠️ **`open-unit-test.mjs` PART E COUNTS THE INCREMENT SITES IN THE SHIPPED SOURCES**
and fails if a second one appears on either page. That guard is the whole defence —
a second timer counting a slightly different number is invisible from inside either
file, because each stays internally consistent.

⚠️ **Nothing stored was rewritten.** Jake's ruling was explicit: the seconds already
banked were a gift and students keep them. This is a correction going forward only.
**Do not "correct" historical figures.**

### 3.6 ⚠️ The idle thresholds differ ON PURPOSE — 2s Library, 3s School

**Decided by Jake, 2026-08-18, closed.** Do not unify them. Do not "align" them. Library
is fluent readers typing prose they can already type, where a two-second gap is attention
drifting. School is beginners locating keys, where three seconds is often the work itself.
A single number either steals time from the students the lessons exist for or hands it to
the ones most able to idle. Round 12 flagged this as a symmetry violation and was wrong.

The symmetry actually required is that both sides pause on idle at all, record the same
*shape* of record, and be equally resistant to running out the clock. All three hold.

Open and minor: **tick resolutions** differ — Library accumulates in 100 ms slices, School
tests once per second — so School can mis-attribute up to about a second around a gap near
its threshold. Worth aligning eventually for precision. **Not a licence to touch the
threshold values.**

Admin-only, not urgent: `ggBypassIdle` ("No Idle" in the Game Genie) makes the School tick
accrue while idle, whereas in `game.js` the same flag only suppresses AFK auto-pause.
Gated on `ADMIN_EMAILS`.

### 3.7 The guest / expired-session merge, and its baseline

A 24-hour auth token lapsing mid-period read as a guest arriving for the first time.
`statsData` is module state and **a sign-out is not a page load**, so the tick kept
incrementing while every writer early-returned on a falsy user. The guest ladder armed,
the student signed back in, and `retroactiveSaveAnonSession()` did
`secondsWeek += server.secondsWeek`. Week doubled.

⚠️ **THE FIX IS NOT `max()`.** Sum is right for a true guest who typed earlier on another
machine; max is right for the expired session; **neither number contains the fact that
distinguishes them.** What was missing is how much of the live counter came from the
server, so that is now recorded:

```
statsBaseline               = statsData at the moment Firestore was read
this browser's contribution = statsData - baseline
merged                      = server + contribution
```

Correct in both cases — a true guest's baseline is zero and it collapses to the original
sum. ⚠️ **The baseline is captured in `loadUserStats()`, ABOVE `statsWalRecover()`.** A
recovered WAL tail is this browser's own unflushed work and belongs on the contribution
side; move the capture below the recovery and a re-auth silently discards whatever the WAL
just replayed.

`sessionExpired` is carried, not inferred — 29 sites in `game.js` alone test it.

### 3.8 The week starts on SATURDAY

`getWeekStart()` in both page controllers returns the Saturday beginning a Sat–Fri school
week, so Mon–Fri sits whole inside one bucket and a weekly goal cannot reset mid-week.
`week-anchor-test.mjs` lifts the function from **both** the app and `reports.html` and
asserts they agree — the v2.10.0 audit computed Mondays, every comparison missed, and the
panel printed "no problems found" across ninety students.

⚠️ **A period boundary right for accumulating is not automatically right for looking
back.** The admin review filter defaults to *Last 7 days*, not Sat–Fri, because a teacher
reviewing on a Saturday would otherwise see the week that just ended excluded entirely.

### 3.9 Stored positions, re-anchoring and the staleness ladder

A bookmark is `(chapter, charIndex)` and **both coordinates are measured against one
version of the text.** Re-upload the library and every stored offset silently becomes an
index into a text that no longer exists. Three rounds hardened the chapter id and nobody
looked at the other coordinate, one line away.

**Proof, then guard, then ladder — in that order, and the order is load-bearing.** Every
write stamps `contentVersion`, `chapterTitle`, `chapterLen` and `anchorText` (~48
characters *behind* the cursor — that is text the student has demonstrably read; an anchor
from ahead would re-anchor them onto content they have never seen). A matching
`contentVersion` is the fast path at zero cost. A mismatch searches for the anchor.
`findAnchorEnd()` returns the occurrence **nearest** the old offset, not the first — a
48-character anchor can legitimately repeat, and taking the first match drags a student
backwards, which looks exactly like the bug.

⚠️ **A chapter that SHRANK below a stored offset is both out of range and perfectly
rescuable**, because the anchor still names the words they reached. That is why proof runs
before the dead-state guard. Putting the guard first throws away the only hard evidence in
the system — and a harness caught exactly that on one run.

**Jake's time-based ladder is load-bearing pedagogy, not a tuning constant:** under a week
→ exact spot; a week to a month → sentence start; a month or more → chapter start. The
reasoning is about what a child remembers. **Do not "simplify" it.** It needed no
migration, because `lastUpdated` was already on every progress document.

⚠️ **An offset at or past the end is a dead state, not a position**, and
`reconcilePosition()` can never return one. "One sentence left to type" is what a stale
offset *looks like*, and Aesop's Fables (284 chapters of ~500 characters) is the library's
best stress case — almost any overshoot lands past the end there. **Never accept "the
chapter completed" as a pass:** check the completion modal, because `0 WPM` and `0m 1s`
means nobody typed anything.

Flip Back is bounded by `furthest`, **not** by the current position — a bound computed from
state the feature itself mutates is not a bound. Cross-chapter is deliberately two-step
because `getSentenceMap()` reads `fullText`, which exists only for the loaded chapter.
⚠️ Sentence-level backjump makes WPM farming easier; **if the leaderboard ever looks wrong,
start here.**

⚠️ **No admin repair tool is buildable as the rules stand.** `firestore.rules` lets staff
read any student's progress but restricts write to `request.auth.uid == uid`. Repairing
from `admin.html` needs a Cloud Function or a looser rule; healing in the client on next
open is better than both, costs nothing for books nobody reopens, and needs no coordination.

### 3.10 Two copies on purpose, and the roster's real shape

`applyPendingClassAssignment()` exists in **both** `game.js` and `learn.js` and neither page
controller can import the other. **Change one, change both** — a student can reach either
page first and the whole point is that it does not matter which. `renderIdStamp()` is
duplicated for the same reason; fifteen lines, and this note is the tripwire for extracting
it if it grows.

The Students roster is built from `typing_logs` over `ROSTER_DAYS` = **45**, so it is
**activity, not enrollment** — an imported student who has never typed cannot appear under
any filter and widening the range will never summon them. That is why the importer could not
see returning students in August, and why intent travels on the pending record (`overwrite`)
instead of being guessed. Every exit path from `applyPendingClassAssignment()` deletes the
record.

⚠️ **Do not "fix" the roster by putting emails in user documents.** The absence of an
email→uid index outside `typing_logs` is the privacy constraint working.

⚠️ **There is no `classAssignedAt` field and there must not be one.** The staff grant on
`users/{uid}` is `.affectedKeys().hasOnly(['classId','schoolId'])`, so a third field is
denied — it would need a console rules paste *and* widen what a teacher may write into a
student's document to store a fact the teacher already knows.

### 3.11 What needs a console paste, and what does not

- **`firestore.rules`** — the `typing_sessions` create rule requires `uid`, `seconds` in
  `[0, 86400]`, `sprints` a list of ≤ 200, and `expiresAt`. It has **no `keys().hasOnly()`**,
  deliberately, so added fields are not denied. Both `source` and `serverAt` rode in on that
  property. Read the comment above `validDailyLog` before "tidying" it.
- **`firestore.indexes.json`** — the drill-down query is equality-only and needs no composite
  index. ⚠️ **Adding an `orderBy` or a range filter does**, and that is a console change.
  `serverAt` is deliberately *not* exempted from auto-indexing, because the first thing anyone
  will want from it is a range query, and removing an exemption rebuilds the index across the
  collection. Re-decide at district scale.
- **App Check is initialized but not enforced.** A `401` on `recaptcha/api2/pat` is visible at
  Ellis; harmless now, an **outage** the day it is enforced if a district filter blocks
  recaptcha paths. Run `ttbAppCheckStatus()` on a real school MacBook on the school network
  first. This rose in priority when book content became world-readable — it is now the only
  thing between Jake's card and a scraper.
- **Content is world-readable on purpose.** `books`, `chapters` and `lessons` are
  `allow read: if true`; `settings` is split by document id so `settings/goals` is public and
  `settings/languageFilter` is not, because publishing a curated list of slurs has no upside.
  ⚠️ **Anonymous Auth was the wrong answer and the rules file used to recommend it.**
  `signInAnonymously` appears nowhere in this repo; enabling it would make `signedIn()` true
  for the entire internet across six unrelated grants.

---

## §4. ⚠️ THE FORWARD PLAN — telemetry step 2

> ⚠️ **SUPERSEDED IN PRIORITY BY §0.9 (2026-08-19).** Everything in this section
> remains valid engineering, and **none of it comes before moving the grade off
> `typing_logs`.** Jake ruled on that directly. Read §0.9 first.


`DESIGN-TELEMETRY.md` is the design and it is live; read its §2 (verification-only, every
claim read out of shipped source) and §8 (things that must not happen) before writing code.
Steps 1 and 1.5 shipped in Round 13. **Step 2 is next: make `typing_logs` derived rather than
written from a live in-memory counter.** It closes §3.1's data-loss path and is worth more
than Rounds 12 and 13 combined.

⚠️ **Step 2 has a prerequisite of the same shape step 1.5 had. Found by Round 14 reading the
writers; not yet fixed.**

Step 1.5 fixed session *coverage* — abandoned units now produce records. It did not fix
*timeliness*. Session records are created only at unit boundaries and on hide/pagehide;
nothing periodic. Meanwhile `typing_logs` is rewritten from the live counter every five
minutes, deliberately, so a teacher looking mid-period sees today. **A student twenty minutes
into an uninterrupted chapter has twenty minutes in the counter and zero session records.**
Derive `typing_logs` from sessions as specified and that student's daily figure sits flat at
their last completed unit for the whole twenty minutes — a day-one visible regression, and the
mirror image of the undercount step 1.5 fixed.

**One decision is required before step 2 can be written. It is not Claude's.**

⚠️ **THE GRADED CLOCK IS DECIDED. Jake, 2026-08-18: the clock starts on the first
keystroke of a run and not before.** That is `stepSeconds` semantics — School's
existing graded gate — and it is now the definition of "time typed" on BOTH sides.
Recorded here and in `DESIGN-TELEMETRY.md` §2.7 because the previous round scoped
this work in conversation and never wrote it down, which cost it entirely.

✅ **SHIPPED in Round 14** — `game.js` v3.26.0 / `learn.js` v2.10.0. See §3.5.

**Still open — where the sum comes from:**
   - **(a) Query the day's sessions at flush time.** Literally what the design says.
     Closes §3.1 completely. Costs ~15–30 reads per flush per student — the one figure in
     `SCALE-PLAN.md` that was never checked.
   - **(b) Per-source fields in `typing_logs`** (`secondsLibrary` / `secondsSchool`), each
     written by exactly one page, summed on read. Makes the cross-mode clobber *structurally
     impossible* with no extra reads. Costs changes in `reports.html` and `lessons-admin.js`.
   - **(c) A local accumulator of committed sessions.** Cheapest, and **does not close §3.1**
     — two modes, two accumulators, same clobber. Ruled out here on the record rather than by
     omission.

**After step 2:** make `stats/time_tracking` a rebuildable cache with a "rebuild from sessions"
action in `reports.html`; weekly archive plus retention (⚠️ `typing_sessions` has a **120-day
TTL**, so once totals derive from sessions, day 121 makes last spring's numbers start
shrinking — a correctness bug waiting on a calendar); retire the week audit once the rest runs
clean for two weeks.

⚠️ **Do not answer the next divergence with a better audit.** An audit is a confession that the
data model permits states you have to go looking for.

⚠️ **Do not backfill synthetic session records.** School has no session history before
2026-08-18 and never will; manufacturing per-run detail that never existed is worse than an
honest gap.

### 4.1 ✅ THE CLOCK UNIFICATION — SHIPPED, Round 14

Done. `game.js` v3.26.0, `learn.js` v2.10.0, guarded by `open-unit-test.mjs` Part E.
Full detail in §3.5. **What remains of step 2 is below; this is no longer a blocker.**

⚠️ **What Jake should expect to see, and it is the only visible consequence:**
recorded minutes drop slightly from the deploy forward — the two free seconds at the
head of every Library sprint, and the seconds between a School student's first
keypress and their first correct one. Small per run; a struggling typist on a ten-run
lesson loses more than a fluent one. **It is a correction, not a regression**, but a
week-over-week comparison across 2026-08-18 will show a step change with no other
explanation. That date is the boundary; it is recorded here and in
`README-SESSION-LOGGING.md` so nobody debugs it later as a defect.

### 4.2 ⚠️ Open rulings that have been waiting since Round 8

Both were answered *by default* rather than by decision, and both have been carried unanswered
through five rounds. They are small.

- **Does re-reading a chapter un-tick its ✓?** Ships as "no", the non-destructive default.
  `completedChapters` feeds `chaptersCompleted` in the stats rollup and the ✓ in Game Genie's
  picker. Clearing it edits a record of something the student did; keeping it shows chapters as
  done that they are actively redoing. If you want it cleared, the place is `flipBackTo()`.
- **Should a hard time cap override a confirmed anchor match?** Ships as "no" — a found anchor
  wins regardless of age, because it is proof rather than a guess, and time governs only the
  fallback. If you want caps that override even a confirmed match, that is
  `reconcilePosition()`'s first branch and nothing else.

---

## §5. Invariants

⚠️ **THESE NUMBERS ARE APPEND-ONLY. DO NOT RENUMBER THEM. EVER.**

Round 14 renumbered once, as a repair, and it cost seven file uploads. The old sequence was
genuinely unusable: Round 9 assigned 56–81, and Round 11 — told to continue from Round 8, which
ended at 55 — **also started at 56**. Every number in that range meant two different things and
the code cited both meanings. A new invariant now takes the next free number and goes at the
bottom of its group. Citations in code carry the invariant's **name** as well as its number, so
a number that somehow drifts can still be resolved.

### Data, counters and records (1–16)

1. **ONE QUANTITY, ONE RECORD.** Two documents — or two fields — holding the same number will
   disagree. If you need a second view, make it an explicitly rebuildable cache and say so in
   the file header. **A cache you can always rebuild from truth is not a second source of
   truth.**
2. **TWO RECORDS OF ONE QUANTITY MUST SHARE A WRITE TRIGGER.** Not "be flushed often enough."
   Any staleness budget granted to one and not the other is a divergence you agreed to,
   debugged later by someone who does not know you agreed.
3. **A MERGE NEEDS A BASELINE, NOT A BIGGER HAMMER.** `sum()` and `max()` are both guesses at
   the same missing fact and each is silently wrong where the other works.
4. **A RECORD IS DATED WHEN IT HAPPENS, NOT WHEN IT IS WRITTEN.** Anything queued for later
   delivery carries its own timestamp, or a delayed flush relabels history.
5. **A RECORD IS ONLY COMPLETE WHEN ITS UNIT CAN END WITHOUT WARNING.** "It will finish" is an
   assumption about a twelve-year-old with a lid and a bell.
6. **RESET A WATERMARK WHEREVER YOU RESET WHAT IT MEASURES**, in the same place.
7. **ABSENT BEATS APPROXIMATED.** A field named for a trusted source, filled in by an untrusted
   one, type-checks and lies. Omit it and let the reader see it missing.
8. **A SIGNAL MUST BE PLANTED BEFORE IT IS NEEDED.** A comparison against history is worthless
   the day it ships and valuable a term later. Shipping the write side alone is a complete
   deliverable.
9. **"UNKNOWN" IS NOT "EXPIRED."** An absent or unparseable timestamp falls back to the
   permissive reading, or legacy data becomes silently unusable.
10. **A PENDING DOCUMENT IS A MESSAGE; READING IT CONSUMES IT.** Every exit path deletes. A
    record that cannot act must not survive to be re-read.
11. **A SIGN-OUT IS NOT A PAGE LOAD.** Module state survives it.
12. **`null` USER MEANS TWO DIFFERENT THINGS.** "Never signed in" and "token expired" need
    opposite handling everywhere they are tested. Carry the distinction; do not infer it.
13. **AN ID IS A LABEL.** Never `parseInt` one.
14. **BUMP THE CACHE KEY WHEN THE CACHED SHAPE CHANGES**, or the change silently does nothing
    for six hours.
15. **A CACHE GUARD CANNOT CATCH A WELL-FORMED STALE ENTRY.** Drop the goals cache
    unconditionally on any class change, not only when it looks empty.
16. **A PER-DEVICE ID IS NOT A PER-PERSON ID.** Two guests share a browser profile; what
    separates them is the tab, so scope to `sessionStorage`.

### Stored positions and restored state (17–28)

17. **ANY STORED OFFSET INTO CONTENT IS A FOREIGN KEY INTO A VERSION YOU DID NOT RECORD.**
    Character indices, line numbers, scroll positions, timestamps into media. Store what it was
    measured against, or a fingerprint of the content, or accept that it rots silently.
18. **WHEN YOU HARDEN ONE HALF OF A COMPOSITE KEY, STATE WHY THE OTHER HALF IS SAFE.** Three
    rounds hardened the chapter id, each writing a comment about renumbering. The character
    offset sat one line away, untouched, the whole time.
19. **THE DANGEROUS BUG IS NOT THE ONE THAT ERRORS — IT IS THE ONE THAT COMPLETES.** Ask of any
    restored state: *if this value were wrong, would the app fail, or would it succeed at
    something else?* A student does not report a smooth failure; they report finishing.
20. **AN OFFSET AT OR PAST THE END OF ITS CONTENT IS A DEAD STATE, NOT A POSITION.** Guard the
    *shape* of the answer — "does this leave anything to do?" — not just its range.
21. **RECENCY IS NOT VALIDITY.** A bookmark written an hour ago is garbage if the content
    changed after it was written. Never let an age threshold decide whether a provably invalid
    value is acceptable.
22. **PREFER PROOF TO POLICY WHERE PROOF IS CHEAP.** 48 characters per write turns "we think
    they were about here" into "they were exactly here."
23. **CONSULT PROOF BEFORE APPLYING A GUARD.** A value can be both out of range and exactly
    recoverable. Guards that run first discard evidence.
24. **A SELF-HEALING SYSTEM MUST NEVER WRITE ITS OWN BAD STATE BACK AS VERIFIED.** It converts a
    recoverable fault into a permanent one and deletes the evidence. Before writing a "this is
    now correct" marker, check that it *is*.
25. **A SYSTEM THAT CAN ONLY ADVANCE CANNOT RECOVER.** When auditing a flow, list the moves
    available and check whether any go backwards.
26. **SHIPPING THE GUARD IS HALF THE JOB WHEN A BUG HAS BEEN WRITING BAD STATE.** Ask "what did
    this corrupt that my fix cannot reach?"
27. **A BOUND COMPUTED FROM STATE THE FEATURE ITSELF MUTATES IS NOT A BOUND.** Flip Back bounded
    by the current position collapses the instant it is used.
28. **AN ESCAPE HATCH BELONGS WHERE PEOPLE ARE WHEN THEY NEED IT.** Ask of any recovery
    affordance: *what screen is someone looking at at the moment they realise they need this?*
    And do not gate it on the rare fault — an affordance that appears only after one is an
    affordance nobody has learned to look for.

### Deleting, refactoring and dead code (29–38)

29. **DELETING A SUBSYSTEM MEANS DELETING ITS READERS.** A deleted declaration leaves its
    references grep-invisible. Run `undefined-calls-test.mjs` first.
30. **AN UNDECLARED IDENTIFIER THROWS IN EVERY EXPRESSION POSITION**, not only when called, and
    takes down every statement after it in the same function.
31. **"DECLARED SOMEWHERE IN THE FILE" IS NOT "IN SCOPE HERE."** Three bugs of this one class
    have shipped in this codebase.
32. **THE GRAVITY OF DEAD STATE IS PROPORTIONAL TO HOW CAREFULLY IT IS MAINTAINED.**
    `lastSavedIndex` had eighteen assignments and no consumer, and its tidiness is what
    recruited a later round into adding a nineteenth.
33. **`_inited = true` SET BEFORE THE RISKY WORK IS A TRAP.** It turns a one-time failure into a
    permanent one. Set it last, or in a `finally`.
34. **A SHORT-CIRCUIT ADDED FOR ONE CASE WILL BLOCK A LATER RULE FOR ANOTHER.** When you add a
    rule downstream of an early return, test the early-return path against it.
35. **NEVER COMPUTE A DELETION SLICE FROM A LOOSE TEXTUAL MATCH.** A `startswith` once matched a
    comment in the file body and took 370 lines with it. Anchor deletions to an asserted line
    index, and assert the count before splicing.
36. **A PARSE CHECK PROVES SYNTAX, NOT SURVIVAL.** Before shipping a file edited by script, diff
    its declaration list against the previous copy.
37. **AN OLDER COPY OF A FILE IS A LIVE HAZARD, NOT A BACKUP.** Diff every file in a handed-over
    archive before touching any of it.
38. **A FEATURE THAT WALKS EVERY RECORD AND RE-SAVES IT TRIGGERS EVERY LATENT
    READ-MODIFY-WRITE BUG AT ONCE.** Ask what the save path does to values the form cannot
    represent.

### Tests and harnesses (39–58)

39. **A TEST THAT REIMPLEMENTS THE CODE IT TESTS PASSES AFTER THAT CODE IS DELETED.** A harness
    must lift, import or parse the *shipped file*, or it is testing a fossil.
40. **A GREEN SUITE IS EVIDENCE ABOUT THE MACHINE IT RAN ON.** Before claiming a dependency is
    declared, open the file.
41. **TEST THE FRESH-CLONE PATH.** The environment that built the thing is the one guaranteed
    not to reproduce a new contributor's experience.
42. **A LIFTED FUNCTION MUST BE SELF-CONTAINED.** Every module-scope reference becomes a
    ReferenceError inside the sandbox, swallowed by the function's own catch. Adding a
    dependency to a lifted function means updating its harness in the same commit.
43. **A HARNESS THAT LIFTS A BODY CONTAINING A TEMPLATE LITERAL MUST BUILD ITS SANDBOX BY
    CONCATENATION.** `${...}` is interpolated by the outer template before Node parses anything,
    and the SyntaxError points at the harness rather than the cause.
44. **A HARNESS THAT LOCATES CODE BY A COMMON SUBSTRING WILL ONE DAY TEST A DIFFERENT FUNCTION
    AND BLAME THE WRONG AUTHOR.** Anchor on something unique; throw a named error when it is not
    found.
45. **A TEST THAT ONLY PRINTS IS NOT A TEST.** Ask what a harness would have to see before it
    fails.
46. **A HARNESS THAT CRASHES TELLS YOU LESS THAN ONE THAT SURVIVES.** Running it against old code
    is the whole point, and a stack trace hides the other assertions.
47. **GRADE YOUR OWN ASSERTIONS.** Tag them `[BEHAVIOURAL]` or `[STRUCTURAL]`. Structural ones
    catch invisible, expensive defects and also break on innocent refactors; a harness that does
    not grade itself invites both to be trusted equally.
48. **THE NUMBER AN ASSERTION EXPECTS IS WHERE THE AUTHOR'S MISCONCEPTION LIVES.** A green
    harness proves the code agrees with the author, not with reality. When a test passes first
    try, re-derive the expected values from the requirement.
49. **DO NOT HAND-WRITE AN EXPECTED ORDERING.** Compute it from data already verified.
50. **TEST A COPIED CONSTANT AGAINST ITS SOURCE FILE**, not against your reading of it. The
    Monday week anchor was a confident assumption never checked against the source twelve feet
    away.
51. **A SHARED MODULE'S DEPENDENCY LIST IS A CONTRACT BETWEEN FILES THAT CANNOT SEE EACH OTHER.**
    Assert both call sites' dep sets are equal.
52. **ASSERT AN EXACT KEY SET, NOT THE ABSENCE OF ONE KEY.** `sig.classroom === undefined` passes
    just as happily when the whole function has been renamed out from under you.
53. **WHEN A FEATURE IS REMOVED, ITS TESTS ARE INVERTED, NOT DELETED.** The removal is itself a
    contract, and contracts want tests.
54. **A PERMANENTLY RED TEST IS WORSE THAN A DELETED ONE.** It trains everyone to read "1
    failing" as the expected number and the next real failure hides behind it. If a harness goes
    red and cannot be fixed the same day, delete it or skip it loudly.
55. **A VERSION PIN IS A DEPLOY DIAGNOSTIC, AND PINS COME IN SETS.** Grep for every assertion on
    a module's version before bumping it; two harnesses pin `session-log.js` and moving one is
    how you find out about the other.
56. **`node --check foo.js` DOES NOT CHECK AN ES MODULE.** Use `node --input-type=module --check`.
57. **A VERSION AUDIT CANNOT CATCH A VERSION LIE.** It compares a file's claims against the same
    file's other claims. Only a behavioural test knows what the code does.
58. **A HARNESS WITH AN ABSOLUTE PATH IS A COMMENT**, and a hardcoded denominator in a diagnostic
    is worse than no diagnostic.

### UI, rendering and reporting (59–71)

59. **AN AUDIT MAY NEVER HAVE A SILENT SKIP.** Every subject lands in exactly one named bucket,
    every bucket is counted on screen, and the totals are printed so they can be checked by eye.
    **"Could not be examined" and "passed" are opposite findings and must never render
    identically.**
60. **TWO WRITES TO THE SAME OUTPUT ELEMENT IN ONE SYNCHRONOUS BLOCK: THE FIRST ONE NEVER
    HAPPENED.** No linter, parser or identifier check can see it.
61. **WHEN A RENDER FUNCTION AND ITS CALLER BOTH REPORT STATE, THE RENDER WINS.** It is the one
    holding the filters.
62. **A COUNT THAT CONTRADICTS THE LIST BELOW IT IS WORSE THAN NO COUNT.**
63. **SAY WHAT A LIST IS MADE OF WHEN IT IS NOT MADE OF THE OBVIOUS THING.** A roster built from
    activity logs cannot show an enrolled student who has not acted.
64. **`innerHTML +=` DESTROYS LISTENERS IN THE WHOLE CONTAINER.** It is a read, a concatenate and
    a full re-parse of the subtree. Bind after the last write, never before.
65. **A BADGE THAT APPLIES TO EVERY ITEM IS NOT A BADGE.** Ask what fraction of rows a flag will
    appear on before adding it.
66. **A FEATURE THAT IS WRONG EVERY TIME GETS RECLASSIFIED AS DECORATION**, and then nobody
    reports it. Ask what a user has stopped trusting.
67. **A MISSING OPTION IN A `<select>` IS A DATA-LOSS BUG.** `selectedIndex = -1` reads back as
    `''` and gets saved. A `select` + Custom… pair cannot be cleared with `.value = ''`.
68. **AN `<a>` MAY NOT CONTAIN AN `<a>` OR A `<button>`.** Browsers recover by closing the anchor
    early and reparenting the rest. Not a CSS problem.
69. **`justify-content: center` + `overflow: auto` CLIPS AT THE START**, and the clipped part
    cannot be scrolled to.
70. **`escapeHtml`-BY-DOM DOES NOT ESCAPE QUOTES.** Fine in element content, fatal inside an
    `href`.
71. **A PERIOD BOUNDARY RIGHT FOR ACCUMULATING IS NOT RIGHT FOR LOOKING BACK.** Ask what day the
    person is standing on when they open the screen.

### Matching, creating and coalescing (72–83)

72. **BEFORE GIVING A "NOT FOUND" BRANCH THE POWER TO CREATE, FIX WHAT COUNTS AS FOUND.** A
    tolerant matcher and a creating branch are one feature; shipping the create half against a
    strict matcher manufactures duplicates, and duplicates of a container silently split
    everything filed into them.
73. **A NORMALISER THAT CAN RETURN EMPTY HAS AN IMPLICIT WILDCARD IN IT.** Any two inputs
    normalising to nothing match each other.
74. **A NORMALISER AND A DIFFER MUST COMPARE ON THE SAME SIDE OF THE NORMALISATION**, or the
    differ reverts the normaliser.
75. **REFUSE RATHER THAN APPROXIMATE** wherever the value is a claim rather than a preference — a
    licence, a version, an age range, a chapter identity. `''` plus a human is cheaper than a
    false assertion in the database, and the refusal belongs at the level of the whole operation,
    not one field.
76. **REQUEST COALESCING IS ONLY VALID BETWEEN INTERCHANGEABLE CALLERS.** An unauthenticated
    caller and an authenticated one are not. Share successes; never share a failure with someone
    who would have succeeded.
77. **AN EMPTY RESULT AND A DENIED ONE ARE INDISTINGUISHABLE DOWNSTREAM.** If both render the
    same blank screen, treat the ambiguous case as the one a retry can fix.
78. **WHEN TWO SUBSYSTEMS IMPLEMENT THE SAME PROMPT, THE DUPLICATION IS THE VISIBLE DEFECT AND
    THE DIVERGENCE IN WHAT THEY DO IS THE EXPENSIVE ONE.** Ask what each does when the user says
    yes, *before* merging the copy.
79. **A CHOICE MUST GOVERN EVERY PATH IT APPEARS TO GOVERN.** If a teacher's answer applies to one
    write path and not the other, behaviour depends on which branch a student fell into, and that
    is not a choice the teacher made.
80. **A FEATURE GATED ON A MODE NOBODY USES HAS NOT SHIPPED.** Grep for the gate before concluding
    a behaviour is absent — and before building it again.
81. **SAY WHICH ONE FAILED.** "3 of 5 failed" forces a retry of all five.
82. **NAME THE METRIC BEFORE BUILDING THE FEATURE.** "Popularity" is books opened or sentences
    typed, and the two need different data.
83. **SORT ON A DERIVED KEY AND YOU LOSE LOCALE COLLATION.** Fold diacritics when you derive, or
    Brontë files after Zola.

### Judgement and process (84–99)

84. **AN ABSENCE IS A DIVERGENCE WITH NOTHING TO GREP FOR.** Two copies that disagree can be
    diffed; one copy and a missing one cannot, and the missing side stays invisible until somebody
    asks for the feature it never had.
85. **ASK FOR ONE MEASURED NUMBER BEFORE CHOOSING WHICH BUG YOU ARE FIXING.** "One sentence to
    type" had two causes with no overlap in their fixes. One readout cost one exchange and
    eliminated an entire investigation.
86. **A SCREENSHOT CARRIES MORE THAN THE NUMBER YOU ASKED FOR.** Read the whole image, not the
    field you requested.
87. **DIAGNOSING A BUG DOES NOT INOCULATE YOU AGAINST WRITING IT.** One round fixed a coalescing
    bug in `learn.js` and reached for the identical broken shape in `index.html` within the hour.
88. **THE FIX THAT MAKES A SYMPTOM DISAPPEAR IS NOT ALWAYS THE FIX FOR THE BUG.** Ask: if the thing
    I just changed changed back, would this break again?
89. **VERIFY YOUR OWN COMPLAINTS BEFORE WRITING THEM DOWN.** A claim about a file you did not open
    goes into the README and the handoff and outlives you.
90. **CORRECTING A PREDECESSOR DESERVES THE SAME VERIFICATION AS ACCUSING ONE.** A retraction feels
    like humility and lands in the record with the same authority as the original claim. Round 8
    overturned a true complaint *in the same section* that added invariant 89.
91. **THE SAME CONCEPTUAL CONFUSION GETS COMMITTED TWICE IN ONE SESSION.** After fixing one, grep
    for every other place those two fields are read.
92. **A COMMENT ASSERTING A PERMISSION IS A CLAIM ABOUT A DIFFERENT FILE, AND NOTHING CHECKS IT.**
    Name the rule *and its version* so one line can falsify it. Three files carried "anon auth lets
    students read books" for years; it was never true.
93. **A COMMENT ASSERTING A TEST EXISTS IS WORSE THAN NO COMMENT.** It stops the next person
    looking.
94. **READ THE CORPUS BEFORE READING THE CODE.** One command over 24 files turned a vague report
    into an exact per-book explanation and made every theory unnecessary.
95. **BEFORE ASSUMING YOU BROKE IT, DIFF THE BLOCK AGAINST THE LAST KNOWN-GOOD COPY.**
96. **A BUG ON A PATH NOBODY TAKES IS INVISIBLE INDEFINITELY.** Ask which branch has had nobody on
    it lately.
97. **DOCUMENTS DRIFT EXACTLY LIKE CODE, AND NOTHING CHECKS THEM.**
98. **A DOCUMENT A SESSION PRODUCES SHIPS IN THE SAME COMMIT AS THE CODE**, or it does not exist.
99. **COMMITTING A SUPERSEDED DESIGN DOCUMENT UNMARKED IS WORSE THAN LOSING IT.** Recovering a
    document and *endorsing* it are separate decisions.

### Books, EPUBs and the library (100–105)

100. **`bookMetadata.chapters` IS THE SPINE, NOT THE BOOK.** Use `bodyChapterList()`.
101. **`matter` SAYS TYPEABLE; `about` SAYS CREDITS.** Orthogonal. Collapsing them is the mistake.
102. **FRONT MATTER MUST SURVIVE IMPORT.** The notice is a licence condition, and `game.js` filters
     the picker so it can.
103. **OPEN BOOK MUST RESTORE `matter` AND `about`**, or a re-upload silently resets every non-body
     page to `body`.
104. **UPLOAD ALL PRUNES ORPHANED CHAPTER DOCUMENTS.** It must, because Fix C renumbers books.
105. **YOU CANNOT LICENSE A PUBLIC-DOMAIN TEXT; YOU CAN ONLY LICENSE YOUR OWN EDITS.**

### Later additions (106– )

New invariants go here, at the next free number, and are folded into a group above
at the next consolidation **without changing the number**.

107. **POSITION IS NOT IDENTITY.** Any handle that survives a re-render must be a
     stable key — a `uid`, a document id — and must be resolved to an index at the
     moment it is used, never at the moment it is captured. `reportData` is sorted
     **in place**; an array index captured before a `renderTable()` names a
     different student afterwards. Round 18 wrote this bug and caught it by
     reading, not by testing: the arithmetic is identical either way, so a suite
     that checks totals stays green while corrections land on the wrong children.
108. **BUILD THE INSTRUMENT BEFORE THE REPAIR.** If you cannot see whether a
     number is wrong, you cannot tell whether your fix helped, and you will ship
     the fix anyway because it looked right in the code. Round 16 changed how
     three counters were written before anything existed to check them and
     shipped three defects in two days. An observation tool that writes nothing
     is deployable on a school night; a write-path change is not.
109. **"NOT MEASURED" MUST NOT RENDER AS "MEASURED, CLEAN".** A zero, a blank
     cell, an empty column in an exported spreadsheet, a truncated result, a
     cancelled run showing partial rows — every one of these gets read as an
     all-clear by a tired person at 4pm. Initialise to `null` and render `—`;
     refuse rather than truncate; discard partial results rather than display
     them; and when a repair invalidates a measurement, clear the measurement
     instead of leaving it on screen.
110. **A GUARD THAT CANNOT FAIL IS NOT A GUARD.** If the value a check tests is
     supplied by the same code path that does the checking, the check is a
     tautology and the thing it was written to catch is unprotected. Round 26's
     defect was a period guard on the one side of a subtraction that the caller
     synthesised; `learn.js` had written the tautology down as a guarantee, in a
     comment, and two rounds read it as reassurance. **Ask what input would make
     this guard fire. If you cannot construct one, the guard is a comment.**
111. **TWO COPIES OF A FUNCTION ARE ONE DEFECT WITH A DELAY.** Four
     hand-maintained twins failed on 2026-08-21 — `mergeGuestStats()`,
     `applyGoalCelebrationState()`, the HUD furniture, the celebrations. The
     celebration copies had drifted in three details nobody chose, none of which
     anyone would have filed. **A comment saying "copied from game.js" is not
     documentation, it is an open ticket.** When you find yourself editing the
     same logic in two files, stop and extract it; the second edit is the one
     that gets forgotten.
112. **FEEDBACK ON A PREVIEW IS FEEDBACK ON THE PREVIEW.** A mockup that renders
     badly generates comments about the mockup. Recording those as product
     rulings invents work and, worse, invents constraints. Ask which artefact
     the person is looking at before writing anything down. See §0.-13.F.

---

## §6. Known problems left standing

1. **`chunktest.mjs` tested deleted code and is DELETED (Round 14).** It reimplemented the v3.9.2
   rollup loop inline instead of importing `session-log.js`, so it passed green on a fossil.
   `session-merge-test.mjs` Part B is its replacement. If it ever reappears, it came from an old
   copy — invariant 37.
2. ⚠️ **Historical day counters may be doubled and no audit can detect it.** If a student hit the
   additive merge on a day their stats doc had already been written, the day counter doubled too
   and that value reached `typing_logs` — the audit's yardstick — so those days look
   self-consistent. Session rollups are the independent check where they exist: all Library days,
   School only from 2026-08-18. **For School days before that there is no second record and never
   will be.** Cannot recur from `game.js` v3.23.0 / `learn.js` v2.7.0 forward.
3. ✅ **RESOLVED, Round 19 — and it was never a metadata question.** This entry
   read "a bookclean/import metadata question, not an app defect" for several
   rounds. The harness was reporting **two real defects in `admin.js`**, both
   fixed in v3.31.1: (a) `dc:rights` read only its FIRST element, and Standard
   Ebooks emits two — so the CC0 half of the licence was silently dropped at
   import, on a licence family whose one legal obligation is attribution;
   identical in shape to the `dc:source` bug fixed in v3.26.0 two lines away.
   (b) `readInBookSignals()` scoped its Credits lookup to `#pg-machine-header`,
   which the bookclean pass strips — so all thirteen cleaned Gutenberg books
   imported with **no transcriber attribution at all**. The harness went to
   v1.4.0: it classifies Gutenberg books by the `_g` filename convention instead
   of a hand-kept id list that goes stale on every batch, normalises the
   `-claudeCleaned` rename, asserts the origin URL by SHAPE, and makes the
   credits assertion conditional on the book actually having a Credits row
   (wizard-of-oz has none — verified by scanning every xhtml entry).
   ⚠️ **THE LESSON, WHICH IS INVARIANT 54 WITH A BODY: an accepted red was
   hiding two real bugs for four rounds, exactly as predicted.**
4. **`audit-versions.mjs` reports 7 header-budget problems** (`game.js` 135 lines / 13 entries,
   `learn.js` 152/16, `admin.js` 69/7, `lessons-admin.js` 76, against budgets of 60 and 6). Three
   rounds called migrating entries into `CHANGELOG.md` "the cheapest real task available" and none
   did it. `CHANGELOG.md` is kept (Jake's call, Round 14) but its index is stale — `game.js`
   entries stop at v3.19.1, `learn.js` at v2.2.4, and there is no section at all for
   `session-log.js`, `stats-wal.js` or `hud.js`. **Either backfill it or raise the budget; do not
   call it cheap again without doing it.**
5. **`resume-path-test.mjs` does not exist** and `learn.js` ~line 1554 asserts in a comment that it
   does. Flagged by four rounds. Invariant 93. Write it or delete the claim.
6. **`renderIdStamp()` is duplicated in `game.js` and `learn.js`.** Fifteen lines, unchanged
   tripwire.
7. ⚠️ **71 CHARACTERS MISSING FROM 8/19's RECALC versus the displayed sprint totals. CAUSE
   UNKNOWN — DO NOT GUESS.** Round 16 formed a session-writing theory and **Jake's console output
   disproved it**. That is the whole state of knowledge: one theory, tested, dead. Round 18 did
   not attempt this and deliberately added no speculation to it; what it *did* add is the
   instrument — the `Δ` column carries a **characters delta alongside the time delta**, and the
   CSV export carries `Delta Characters`, so the next attempt starts from a population of cases
   rather than from one screenshot. Get a sample across many students before theorising again.
8. ⚠️ **A THIRD DUPLICATE APPEARED AFTER `session-log.js` v1.3.0 SHIPPED.** The serialization in
   v1.3.0 stops two *concurrent* flushes writing the same queue twice; it does **not** stop a
   queue entry being re-sent by a **later page load** if the clearing `localStorage` write never
   persisted during teardown. **That is a hypothesis and is labelled as one.** The likely durable
   fix is deterministic document ids with `setDoc` instead of `addDoc` — which needs a
   `firestore.rules` change to allow owner `update` on `typing_sessions`, and **getting that wrong
   stops session recording silently**, which is the worst failure shape in this codebase. It is
   not a school-week change. Round 18 did not touch it. Note the interaction: duplicates inflate
   the drill-down but are already excluded from `recalcDailyLog()`, from the `Sessions` column and
   from every rebuild, so this defect currently costs *visibility*, not *grades*.
9. **The reconciliation view cannot see a student who has no `typing_logs` document at all.**
   `reports.html` v2.15.0 sweeps every student **in the report** across every date in the range,
   so a missing *day* is caught. A missing *student* is not — they never appear in the report to
   be swept. Closing it means iterating the class roster rather than the report as the source of
   truth, which is a real change to how that page is built, not an addition to it. Stated in the
   panel's own notes so nobody reads a clean sweep as a complete one.
7. **App Check initialized, not enforced.** §3.11.
8. **`firestore-rules.test.mjs` has never been executed** and is known wrong — it seeds roles as
   auth-token claims while rules v2.x reads `staff/{uid}` documents. Needs a CLI and an emulator,
   which Jake does not have. Its guest-boundary assertions are the only automated statement of
   where that boundary is.
9. ⚠️⚠️ **ASSIGNING A CLASS FROM ADMIN WRITES `classId` AND NEVER `schoolId`, AND IT IS NOT
   "FINE WITHIN ONE BUILDING" — THIS ENTRY SAID SO FOR THREE ROUNDS AND WAS WRONG.** Confirmed by
   reading in Round 31, and it is ROADMAP item 11. **There are TWO direct writers**, not one:
   `lessons-admin.js:1129` (single student) and `:1776` (`_bulkAssign()`), and both write
   `{ classId }` alone. `schoolId` is then **ABSENT, not empty** — Jake's console read of
   `users/{nico}` shows no such field — so a student is in a class that belongs to a school they
   are not in, visible under *All schools* and **invisible under their own**. ⚠️ **THE CORRECT
   PATH ALREADY EXISTS AND IS THE OTHER ONE**: `learn.js applyPendingClassAssignment()` writes
   `{ classId, schoolId }` together and its comment says exactly why (*"a student with a class but
   no building is invisible to their own teacher"*). Two writers, one right. **The fix is probably
   to route the admin assign through the pending record rather than to add a third writer.**
   ⚠️ **AND THE DISPLAY HALF IS A SECOND, SEPARATE BUG** (ROADMAP item 11, Bug B): Settings kept
   saying *"No class assigned"* after a correct assignment because `loadGoals()` caches class info
   in `ttb_goalsCache_v1` for **24 hours**, and its hit-guard only rejects an entry that has a
   `classId` with no `className` — `''` is falsy, so an *unassigned* entry sails through as a hit.
   The import path clears that key deliberately (see its v2.2.4 note); **a direct admin write has
   no way to reach a cache on the student's Chromebook.** ⚠️ Every log flushed inside that window
   is stamped `classId: ''`, so the student's first day is missing from every class-filtered
   report. **Fixing the writer will not fix the display, and fixing the display will not fix the
   stamp.**
10. **`_onClassesChanged()` is probably vestigial** — it exists to refresh a custom-claims token,
    and claims were removed. **Not investigated. Check `admin.js`'s hook before deleting.**
11. **No word or character count exists anywhere in the book schema**, so library "Length" sorts by
    chapters, and Aesop's 284 fables sort as the longest book while being among the shortest to
    type. **"Popularity" is unbuilt** and needs a scheduled Cloud Function to be affordable — which
    needs a functions deploy, which is Jake's call.
12. **`lastSavedIndex` is dead state** — eighteen assignments, two reads, both of which only save
    and restore it around practice mode. Nothing consumes it; `walDirty` drives flushing. Clean,
    self-contained deletion for whoever wants one. Invariant 32.

---

## §7. Jake — working with him

- **He tests immediately and reports the number, not the impression.** "Got a reminder at 2 minutes"
  identified which of four ladders had fired, on which page, from which file, in one clause. **Take
  his descriptions literally; they are usually the diagnosis.**
- **He will ask "are you sure?" and he is usually right to.** "But we delete the front matter, don't
  we?" and "shouldn't it be 2.2.1?" both caught real errors. Check properly before answering, every
  time.
- **He hedges when he is right.** Verify the hedged claim and say plainly which way it came out.
- **He answers a policy question with a better policy.** Given three flat options for the legacy
  cohort he returned a graded, time-keyed ladder — plus a throwaway line that was itself the design
  constraint. **Ask, and take the answer seriously rather than as a tiebreak between your own two
  ideas.**
- **He reasons from what a child will experience, not from what is easy to build.**
- **He sends screenshots that answer more than the question asked.** Invariant 86.
- **He supplies domain knowledge you cannot derive, mid-round. Stay interruptible.**
- **He tells you when something is good enough.** "Books did take a literal second to load, but
  that's not horrible" is a decision, not a complaint. Do not go optimise it.
- **"Prioritise" means go deep, not wide.** Do not read a broad to-do list as permission to skim.
- **He acts on findings immediately.** Report as you find, don't batch to the end.
- **He is fine with "I won't ship what I can't watch run."** Said across several rounds; it has
  never landed badly.
- **"What's next in the roadmap?" means give an ordered list with reasons.**
- **Tell him which uploads matter**, not what changed. Nine files changed, two fix anything — lead
  with the two.
- **Present designs for comment rather than shipping them silently.** His review has caught real
  bugs more than once.
- ⚠️ **Do not burn the session and skip the handoff.** He has had to say "ahem" twice, in two
  different rounds. And do not make him hunt for a document — that is what this consolidation exists
  to end.

---

## §8. Round history — one line each

Kept only so a version number or an instance name in a code comment can be placed. **Nothing here is
a pointer to a file you should go and read.**

| round | instance | what it was |
|---|---|---|
| 1–2 | Underwood, Dvorak | Write-ahead log replaces per-sentence writes. Lesson-mode pedagogy audit. Roles in documents, not claims. |
| 3 | Blick | Adventure Mode out of alpha. Language filter. EPUB multi-work spines. The document-map rule this file finally enforces. |
| 4 | Oliver | `reports.html` 2.8.0. Storage rules and the cover bug. |
| 5 | Mignon | Chapter identity (`matter`/`about`), library card markup, the first real harness suite. |
| 6 | Noiseless | `undefined-calls-test.mjs`. Two functions wired into the UI and never written. The suite could not run at all. |
| 7 | Hammond | EPUB source/licence precedence — 17 of 23 books wrong. `metadata-map-test.mjs`. Classroom editions. |
| 8 | Yost | The stale character offset, present in every `game.js` ever shipped. `contentVersion` + `anchorText` re-anchoring, Jake's time-based staleness ladder, Start Over and Flip Back. Its own first fix reproduced the bug and the harness blessed it. |
| 9 | Remington | Guest mode had been fully built and had never once executed — `firestore.rules` denied every read. Merged two disagreeing login ladders. CSV class creation. Library sorting. |
| 10 | Williams | Lesson atomicity — the entire checkpoint system deleted on Jake's ruling. Shipped without running the suite and took lesson mode down. |
| 11 | Bar-Lock | Fixed that outage (one line). The rollover import: 10 returning students imported with no error and no effect. |
| 12 | Caligraph | The doubled week counter. School had never logged session detail. `session-log.js` created. Shipped an audit that gave a false all-clear across ninety students and withdrew it the same day. |
| 13 | Ludlow | `serverAt` (write side only). Step 1.5: closing the open sprint/run, delta writes, the watermark. `hud.js`. |
| 14 | Sholes | This consolidation: nine handoffs into one, the invariant renumbering repair, and the step-2 timeliness finding in §4. |
| 15 | Densmore | Fixed Round 14's HUD fix, which shipped green and didn't work. Version footer redesign. AI-practice variety floor (game.js/index.js). HUD long-form clip fix. |
| 16 | Royal | ⚠️ MIXED — the source split shipped, broke twice in live use, and was REVERTED the same evening (see §0.6 item 9). Kept: delete→recalc, duplicate detection, flush serialization, week-repair resync, variety-floor extraction. The remediation variety floor (School's practice-missed-keys gap Round 15 flagged). The repair resync — a real incident, fixed and given harness coverage: an audit-repaired week counter that kept getting silently overwritten by a MacBook that skipped its between-period restart. Extracted the two files' duplicated variety-floor filter into `variety-floor.js`, the fifth shared module, with its own harness. The source split (DESIGN-TELEMETRY.md §2.4) — game.js/learn.js write per-source typing_logs fields instead of a shared, clobberable triple; requires firestore.rules v2.4.0 deployed first. Connected delete → recalc on the reports.html session drill-down, so a cheating student's numbers get fixed with zero manual bookkeeping and zero added cost. |
| 17 | Linotype | Repository reorganisation — 79 root entries to 33. No app code changed and nothing the browser loads moved. Harnesses to `tests/`, docs to `docs/`, Firebase config to `firebase/`, the Cloud Function to `functions/`, `audit-versions.mjs` and the Python builders to `tools/`. Found and registered two green-but-unregistered harnesses (`sort-test`, `lesson-atomicity-test`), declared the missing `@xmldom/xmldom`, added the repo's first `.gitignore`, and corrected three rounds of notes claiming `MULTITENANCY.md` had been deleted when it had not. Second pass: merged three test-first harnesses from a concurrent round and added the `PENDING` list to `run-all-tests.mjs` so red-on-purpose harnesses cannot corrupt the headline number. Third pass: the concurrent round's app code landed, all three went green and were promoted, and `session-log.js`'s header/constant mismatch was repaired. |
| 18 | Salter | Built the instrument before touching the repair, which is the whole shape of the round. `reports.html` 2.15.0 only; `game.js`, `learn.js`, `hud.js`, `stats-wal.js`, `session-log.js` and `firestore.rules` untouched. **(1)** A read-only reconciliation view: three sortable TOP-LEVEL columns (`Sessions`, `Δ`, `⧉`) comparing each student's daily-log total against the deduped sum of their actual session records — no expanding required, which was Jake's specific unfixed complaint. Sweeps every date in the range, not just dates with a log row, so a day whose log write never landed is caught. **(2)** Rebuild-all: `⟳` applied across the report behind a preview that separates who moves DOWN from who moves UP, with four refusals — never zero a sessionless day, never invent a missing log document, hold today back by default, and skip any pair that moved between preview and write. Wrote and then caught its own position-is-not-identity bug (corrections would have landed on the wrong children after the table re-sorted); invariant 107. New `tests/reconcile-test.mjs`, 35 assertions, five mutation-verified — and its own header says plainly what it cannot cover. Left §6 items 7–9 deliberately unanswered rather than guessing. |
| 19 | Hermes | The update gate — one number in a console and every open tab in the building collects the new code. Stage 1 and Stage 2 of ONE NUMBER (the student and the teacher read the same document); `daylog.js` created; `stats/time_tracking` deleted from both pages. ⚠️ Stage 2 was REVERTED the same night on finding overlapping rollups and negative character counts in `typing_sessions`. |
| 20 | Corona | Folded its own predecessor's conclusion: §0.0's evidence was sound, its arrow was wrong. The interval UNION vs the deduped SUM. Found the THIRD divergence — a `WHERE` clause, so a log stamped `classId:''` was visible to the child and invisible to every class query. Reproduced §3.1 at last. |
| 21 | Hammond II | Test tooling only, nothing student-facing. The registration audit (an unregistered harness now FAILS the suite). `tab-lifetime-test.mjs`. ⚠️ RAN THE RULES EMULATOR that four rounds recorded as impossible, and found the per-source DOCUMENT design DENIED by the deployed rules. Recorded Jake's four standing rulings in §0.-7.A so they stop being relitigated. |
| 23 | Empire | ⚠️ THE GUEST MINUTE: a child who typed before signing in kept their time in School and lost it in Library, because `game.js` had no guest merge on the auth path while `learn.js` did — and `game.js`'s two INLINE copies meant which of three sign-in buttons they pressed decided the outcome. One function now, before `loadUserStats()`, with the sprints adopted so the minutes reach the record. `learn.js` stopped filing guest runs under the throwaway anonymous uid, and its logout reloads instead of leaving the last student's totals on screen. The reconcile and rebuild-all DELETED on Jake's confirmed boundary (~830 lines), with the real production session documents lifted into `real-sessions-fixture.mjs` first. `session-log.js` made per-owner. ⚠️ Also spent most of its length on a cross-account queue theory that Jake killed with a fact already written in `stats-wal.js`'s header — see §0.-9.E, which is the part worth reading. HANDOFF.md split at 237 KB; Rounds 15–20 to `docs/archive/`. |
| 34 | Fitch | ✅ **A LESSON OPENS AT THE FIRST RUN THAT STILL COUNTS.** Jake found it by using Round 32 in anger: runs are typed in order, so a mastered run 1 had to be replayed for nothing to reach run 2 — **the gate was taxing the student it meant to move along.** `firstOpenRunIdx()` is well-defined because downward closure makes the open runs a SUFFIX. ⚠️ Both intro entry points hardcoded `beginStep(0)`; fixing one leaves which key a child pressed deciding whether it works. ✅ `run-mastery-test.mjs` written — cited in learn.js's header since Round 32 without existing. ⚠️⚠️ §0.-26.C: deleted live code archiving a header entry — the last `// vX.Y.Z` is in the BODY. Bound the search at `const LEARN_VERSION`. learn.js v2.35.0, 50 harnesses. |
| 33 | Fitch | ✅ **ROADMAP 11 FIXED** — Jake's son in his class but not his school, raised three rounds. ⚠️ TWO INDEPENDENT BUGS, ONE SYMPTOM: the writer omitted `schoolId` on two of three paths; the reader cached "no class" for 24h because `classId: ''` is falsy. Fix either alone and nothing visible changes. ⚠️⚠️ §0.-25.B — the obvious repair reads `_classCache`, which is COLD until the Classes panel opens, so it would have written `''` and looked right. `_schoolIdForClass()` is the one answerer and falls back to the class document; the CSV lookup is per row. lessons-admin.js v1.14.0, learn.js v2.34.1, 49 harnesses. |
| 32 | Fitch | ⭐⭐ ROADMAP 14 BUILT — mastery is cumulative points per RUN (A🔥 = 2, A = 1, locked at 4), locked by run, unlocked by lesson, clock from the last lock. Downward closure computed not stored. ⚠️⚠️ The round's real lesson is §0.-24.A: **a handoff every round, in Jake's words** — many turns produced design talk and no document, plus a zip shipped with a red suite and advice to "test it on Nico" when GitHub means deploy IS the standard. ⚠️ §0.-24.B: `>=` → `>` closed the exploit and moved his worked example by a lesson; the harness caught it, the fix is a `reachBack === 0` guard. ⚠️ NOT VERIFIED: the banner and score paths have no coverage and the header cites a harness that does not exist. learn.js v2.34.0, lesson-gate.js v1.1.0, 48 harnesses. |
| 31 | Fitch | ⚠️⚠️ ROADMAP 14b — **THE WRITE SUCCEEDED AND STORED THE WRONG THING.** Leaving a lesson for the map banked the time and dropped the run, and the item's own diagnosis was wrong: `flushLessonProgress()` was being called all along (inside `flushStats()`, on the interval and on every hide). What lost the run was `stopLesson()`'s `loadUserProgress()`, whose first statement empties `userProgress` — so the flush wrote back the record it had just re-read, successfully, every time, with no error path anywhere. ⚠️ A flush appended to the END of `stopLesson()` would have read as a correct fix and changed nothing: **the order is the fix.** `exitLessonToMap()` snapshots, flushes, refreshes the progress cache, reloads, and carries unflushed runs across. `exit-flush-test.mjs` (31 checks, 18 failing against v2.33.0) reproduces the loss through the old exit in Part A before proving anything else. ⚠️ Also: the runner marks a harness bad on a TEXT match for FAIL/ERROR/UNSAFE in its output, so a clean harness can be reported red by a section header — rule recorded in the runner rather than the detector loosened. ✅ Jake amended the "no bulk repair" ruling to MINUTES. learn.js v2.33.1, 48 harnesses. |
| 27 | Chicago | ⚠️ **THE SUITE WAS RED ON DELIVERY AND FIVE FILES WERE LYING ABOUT THEIR OWN VERSION** — `game.js` 3.38.0/3.42.0, `learn.js` 2.23.1/2.27.0, `hud.js` 1.2.0/1.4.0 across a breaking change, plus both stylesheets' CSS stamps. The code was new; only the stamps were stale. ⚠️ Aimed squarely at Monday: ROADMAP told Jake to check the footer for the very numbers a correct deploy would fail to show. ⚠️ The hud.js pin could not fire — a pin inherits the honesty of the hand-maintained number it checks. `tests/version-stamp-test.mjs` moves the existing `audit:versions` check inside `npm test`, failing on lying stamps and NOTING header budgets. `hud-test.mjs` rewritten for `{ lead, sprint }`. No behaviour changed. Item 0b deliberately not started. |
| 26 | Elliott-Fisher | ⚠️ THE STALE DAY CARRIED FORWARD — a tab left open overnight re-posted yesterday's entire day total to today's `typing_logs`, exact to the second and the character, because `mergeGuestStats()` guarded the server side of `live - base` and never the live side. Then the two-row top bar across all four surfaces, the landing readout, the celebration latch, `celebrate.js`, and "I'm done" (`receipt.js`). ⚠️ Four hand-maintained twins failed in one day — §0.-13.E. ⚠️ And it left five version stamps stale, which Round 27 found. |
| 25 | Hall | Audited the whole cutover on its eve and found it sound. `lessons-admin.js` dated `typing_logs` by the stamped field where every other reader keys off the document ID — cosmetic before the cutover, load-bearing after it. The drill filter and the font picker shipped into `learn.js` on Jake's call. |
| 24 | Monotype | ⚠️ OPENED WITH A RETRACTION — records two rounds had called LOST were merely LATE. The evening guest: `sessionLogAdopt()` recomputed dates from UTC, filing an after-7pm Library sprint on tomorrow. THE OVERNIGHT RESCUE shipped on Jake's ruling. Item 3 deleted as a phantom by one grep; item 6 confirmed and fixed for Library. |
| 22 | Smith Premier | ⚠️ §3.1 CLOSED. The writers ship per-source FIELDS, date-gated so the upload is safe on a school night and the shape switches on 2026-08-22. Confirmed Jake's `firestore.rules` v2.6.0 by execution and gave it the harness it never had. Found two readers nobody had counted: `recalcDailyLog()`'s cutover constant was out of scope and would have thrown on the ⟳ button, and `lessons-admin.js` was a fourth reader of `typing_logs` that would have shown every student's week as nearly nothing from Saturday. Rewrote `crossmode-overwrite-test.mjs`, which had spent six rounds validating a design the rules reject. |

---

## §9. Document map

**In the repo and live:**

| doc | what it is for |
|---|---|
| `HANDOFF.md` | this file — the only handoff. **Root**, and it stays there |
| `README.md` | what the project is; file map, data model. **Root** |
| `CHANGELOG.md` | **Root.** Kept, but its index is stale — §6.4. The file headers are the more reliable history. ⚠️ Round 17 left it untouched on purpose: a changelog is a record of what happened, and rewriting old entries to use new paths would falsify it |
| `docs/README.md` | 🆕 index of the folder below — one line per document on when to read it |
| `docs/DESIGN-TELEMETRY.md` | ⚠️ the forward plan. §2 verification-only, §7 build order, §8 things that must not happen |
| `docs/SCALE-PLAN.md` | cost model. Read the header box; its Security section's premise was false and is re-headed |
| `docs/TTL-GUIDE.md` | TTL policy, billing arithmetic, composite indexes. Console steps walked through with Jake |
| `docs/README-SESSION-LOGGING.md` | teacher-facing: session history, the week audit, the ID stamp |
| `docs/PEDAGOGY-AUDIT.md` | Round 2 research. The only record of why the lesson gates are what they are |
| `docs/archive/MULTITENANCY.md` | ⚠️ **SUPERSEDED, and see the correction below.** Kept for two arguments that appear nowhere else; its warning header is what makes keeping it safe |
| `tests/README.md` | 🆕 the suite: what is registered, what is deliberately not, and the standing failure |
| `tests/reconcile-test.mjs` | ⚠️ not a document, listed here because **its header is one** — it states what the reconciliation harness does *not* cover, which is the part that matters. Read it before trusting a green run |
| `tests/TESTING-ttb-test-epubs.md` | the synthetic EPUB test corpus |
| `tools/README.md` | 🆕 `audit-versions.mjs` and the two EPUB builders, with their accepted problem count |
| `library/gutCleaners/*` | the bookclean project's own docs. Separate concern, leave alone |

**⚠️ CORRECTION, ROUND 17 — `MULTITENANCY.md` WAS NEVER DELETED.** This section said it was, from
Round 14 through Round 16, while the file sat in the repo root the entire time. Three rounds of
readers were told not to look for a file that was right there, and told nothing about the file they
would find if they did. It is `docs/archive/MULTITENANCY.md` now, unchanged, with the warning header
it was committed with in Round 6. Everything this section said *about* it remains true: it specified
an Auth custom-claims model that was reversed, and it is the probable reason
`firestore-rules.test.mjs` has never matched the rules it tests. **Whether to delete it for real is
Jake's call.** A tidy-up may move a file; deleting a document three rounds of notes disagree about is
a decision, not housekeeping.

**⚠️ GONE, AND GONE MEANS GONE.** Every `HANDOFF-roundN.md` is deleted; their content is in §1–§8.
`UPLOAD-ORDER.md` is deleted; it described Round 6.

`SETUP-NO-CLI.md` and `RULES-AUDIT.md` were lost long ago. `firestore.rules` cites `SETUP-NO-CLI.md`
by name for granting the first `super_admin`; that is the one operationally real gap, and the remedy
is to write the paragraph into `firestore.rules`'s own header, not to go looking.

**Do not go hunting for any of these, and do not send Jake hunting.** If you ever genuinely need
one, say so plainly and name what you need it for.
