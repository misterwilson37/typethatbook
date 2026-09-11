// run-all-tests.mjs v1.28.0 — Round 116 (Sun): arcade-mount-test.mjs, the first
// harness that mounts and drives a game view. ⚠ REGISTERED IN THE SAME ROUND IT
// WAS WRITTEN; the count moved 97 → 98 in HANDOFF (twice) and README in the
// same edit, because docs-vs-repo-test.mjs C2 reads it.
// run-all-tests.mjs v1.27.0 — Round 104: arcade-pool-test.mjs.
//
// v1.27.0 — arcade-pool-test.mjs. ⚠ REGISTERED IN THE SAME ROUND IT WAS
//   WRITTEN. Explicit array, not directory discovery: an unlisted harness is
//   one nobody runs and it LOOKS like coverage.
// run-all-tests.mjs v1.30.0 — Round 114 (Carriage): lesson-game-layout-test.mjs.
// run-all-tests.mjs v1.29.0 — Round 114 (Carriage): escape-peek-test.mjs,
// run-picker-test.mjs and game-slot-test.mjs, all registered in the round that
// wrote them. An unregistered harness is not coverage.
// run-all-tests.mjs v1.26.0 — Round 103: shatter-board-test.mjs.
//
// v1.26.0 — shatter-board-test.mjs. ⚠ REGISTERED IN THE SAME ROUND IT WAS
//   WRITTEN, because this file uses an EXPLICIT ARRAY and not directory
//   discovery: an unlisted harness is one nobody runs and it LOOKS like
//   coverage.
// run-all-tests.mjs v1.25.0 — Round 102: escape-seconds-test.mjs.
//
// v1.25.0 — escape-seconds-test.mjs. ⚠ REGISTERED IN THE SAME ROUND IT WAS
//   WRITTEN, and that is the whole point of this entry: this runner uses an
//   EXPLICIT ARRAY, not directory discovery, so a harness that is written but
//   never listed here is a file nobody runs — which is indistinguishable from
//   not having written it, and worse, because it looks like coverage.
// v1.24.0 — Round 73 (Duplex): dialogs-test.mjs.
//
// v1.23.0 — Round 65 (Duplex): build-list-test.mjs gained
// Part F (ROADMAP 55a, the metadata grid). No new harness file.
//
// v1.22.0 — Round 64 (Duplex): build-list-test.mjs.
//
// v1.21.0 — Round 61 (Duplex): control-tier-test.mjs.
//
// v1.20.0 — Round 60 (Duplex): mirror-heal-test.mjs.
// ⚠️ IT IS REGISTERED BESIDE logdays-test.mjs ON PURPOSE. That file drives the
// same module and passed throughout ROADMAP 50, because it asks whether
// reconcile() BEHAVES and never whether a page CALLS it. The two are a pair:
// logic and wiring, and the second is the one that was missing.
//
// v1.19.0 — Round 46 (Rem-Sho): session-writer-test.mjs.
// v1.18.0 — Round 45 (Rem-Sho): roadmap-index-test.mjs.
// v1.17.0 — Round 42 (Rem-Sho): im-done-test.mjs.
// v1.16.0 — Round 41 (Rem-Sho): remediation-test.mjs and
// run-grade-test.mjs.
// v1.15.0 — Round 34 (Molle): run-mastery-test.mjs
// registered. 50 harnesses.
//
// ⚠️ v1.13.0 — A CONSTRAINT ON HARNESS OUTPUT, WRITTEN DOWN BECAUSE IT COST A
//          ROUND TEN MINUTES. `run()` marks a harness bad on `r.status !== 0 ||
//          /FAIL|UNSAFE|\bERROR\b/.test(out)` — a TEXT match over everything the
//          harness printed. So a harness that exits 0 and prints
//          "PASS — 31 passing, 0 failing" is still reported FAIL if any line it
//          printed contains the word: a section header reading
//          "C. A FAILED FLUSH MUST NOT LOSE THE BUFFER" is enough.
//          ⚠️ DO NOT LOOSEN THE DETECTOR — a harness that reports its own
//          failures in prose and exits 0 is exactly what it is there to catch.
//          The rule is on the other side: A HARNESS MUST NOT PRINT "FAIL",
//          "ERROR" OR "UNSAFE" EXCEPT WHEN SOMETHING ACTUALLY FAILED. Name the
//          section "a write that does not land" instead.
//
// v1.12.0 — Round 26 (Elliott-Fisher): live-period-test.mjs
// hud-lead-test.mjs, celebration-test.mjs and done-button-test.mjs
// registered. 43 harnesses.
//
// v1.8.0 — Round 24 (Monotype): adopt-date-test.mjs,
// carryover-test.mjs and midnight-test.mjs registered. 38 harnesses.

//
// run-all-tests.mjs v1.5.0 — Round 23 (Empire): guest-merge-test.mjs and
// queue-owner-test.mjs registered; reconcile-test.mjs and union-clock-test.mjs
// DELETED with the reconcile tool they covered; real-sessions-fixture.mjs
// exempted as data rather than a harness. ⚠️ THE AUDIT CAUGHT THE HALF-DONE
// DELETION — the harnesses were removed from disk before their entries were
// removed from FAST, and the suite went red naming both. That is the second
// time it has paid for itself.
//
// run-all-tests.mjs v1.4.0 — Round 6 (Noiseless), amended Round 14 (Sholes),
// Round 16 (Royal), Round 17 (Linotype), Round 21 (Hammond).
//
// v1.4.0 — ⚠️ THREE HARNESSES WERE IN NO LIST AT ALL, AND ONE OF THEM WAS THE
//          ONLY HARNESS THAT DRIVES THE LIVE §3.1 DEFECT. This file printed
//          "ALL 29 HARNESSES PASS" while crossmode-overwrite-test.mjs,
//          union-clock-test.mjs and week-agreement-test.mjs sat beside it
//          unrun. All three are runner-clean and are now in FAST.
//          ⚠️ THE REAL FIX IS THE REGISTRATION AUDIT BELOW, NOT THE THREE LINES.
//          A harness is only coverage if something notices when it stops being
//          run, and until now nothing did — tests/README.md said "thirty-four
//          harnesses, thirty-two registered" when the true numbers were
//          thirty-nine and thirty-four. The count drifted because each round
//          updated the number it remembered instead of the number on disk. The
//          audit now reads the directory and FAILS THE SUITE on any .mjs that
//          is in no list and not explicitly exempt. You cannot add a harness and
//          forget to register it any more; the suite will not go green.
//          ⚠️ NEW LIST `RULES` — harnesses that need the Firebase emulator. They
//          are NOT run by `npm test` (a fresh clone has no JVM guarantee) but
//          they ARE named, so the audit sees them and so nobody concludes again
//          that the rules cannot be tested. `npm run test:rules` runs them.
//
// v1.3.2 — ⚠️ DESCRIPTION FIX, and worth a moment. source-split-test.mjs's entry
//          here advertised "Part C: no split field is fed from the shared
//          cross-mode counter" for a Part C that had been DELETED when the source
//          split was reverted (v2.0.0). The suite was green throughout: nothing
//          asserts that these one-line descriptions match the harnesses they
//          name, so they are documentation with no test behind them and they rot
//          silently while reading as authoritative. If you change what a harness
//          covers, change its line here in the same edit.
//
// v1.3.1 — ✅ THE PENDING LIST EMPTIED ITSELF, EXACTLY ONCE, AND WORKED. All three
//          entries landed together when the concurrent round's app code arrived:
//          the runner reported LAND on each and printed its notice, and all three
//          are promoted into FAST in this same commit, as the mechanism requires.
//          `PENDING` stays in the file, empty, because it is now the documented
//          place to put a test-first harness — and because deleting it would mean
//          the next round has to reinvent it under deadline. See tests/README.md.
//
// v1.3.0 — ⚠️ NEW THIRD LIST: `PENDING`. Three harnesses arrived from a
//          concurrent round written TEST-FIRST — they assert behaviour that the
//          shipped repo does not have yet, so they are red on purpose. Putting
//          them in FAST would have moved the headline from "1 failing" to "4
//          failing", and README's own warning (invariant 54) is that an accepted
//          red is how the next real failure hides. A pending harness therefore
//          does NOT count toward `failed`.
//          ⚠️ THE LIST IS SELF-CLEARING, WHICH IS THE ONLY REASON IT IS SAFE. A
//          pending harness that PASSES is reported loudly as LANDED, because
//          that means the app code shipped and the entry must be promoted into
//          FAST. Nothing may sit in PENDING quietly. If you add an entry here,
//          name the exact file and version it waits on — "pending" without a
//          named blocker is just a disabled test.
//
// v1.2.0 — MOVED INTO tests/. This file now lives one level below the repo
//          root, so it keeps two paths: HERE (this directory, where the
//          harnesses are) and ROOT (the repo root, where every shipped file
//          still is). Harnesses are spawned with cwd: ROOT, which is what
//          they saw before the move, so a harness that reads a relative path
//          off the working directory keeps working.
//          Also REGISTERED TWO HARNESSES THAT WERE GREEN AND UNWATCHED:
//          sort-test.mjs and lesson-atomicity-test.mjs both passed on demand
//          but were in no list, so nothing would have told you the day they
//          stopped. An unregistered passing test is not coverage.
//
// v1.1.1 — description string only: session-merge-test.mjs's entry now
//          mentions the repair-resync coverage its new Part D added.
//
// v1.1.0 — ⚠️ `chunktest.mjs` DEREGISTERED AND DELETED. It reimplemented the
//          v3.9.2 sprint-rollup loop inline instead of importing the module, so
//          when that logic moved into session-log.js the harness kept passing
//          against a copy of code that no longer existed anywhere. Three rounds
//          flagged it and none removed it, because deleting a green test always
//          looks like losing coverage. It was not coverage.
//          ⚠️ ITS REAL REPLACEMENT IS `session-merge-test.mjs` PART B, which
//          drives the actual module. If you are about to re-add chunktest.mjs
//          from an old copy of the repo, read HANDOFF.md invariant 39 first.
//
// There are seventeen harnesses. Before this file, knowing whether they passed meant
// running fifteen commands and reading fifteen different output formats, so in
// practice nobody ran the ones they weren't already suspicious of — which is how
// credit-test.mjs sat broken through a whole round without anyone noticing that it
// was broken rather than passing.
//
//   npm install                            # devDependencies cover the suite
//   npm test                               # the fast suite
//   npm run test:epubs                     # plus the EPUB corpus harnesses
//
// Both scripts run this file from the repo root. Running it from inside
// tests/ works too — every path below is resolved from import.meta.url, not
// from the working directory.
//
// A harness counts as passing if it exits 0 and prints no line matching /FAIL|
// UNSAFE|\bERROR\b/. That is deliberately crude: these harnesses predate any
// shared reporting convention and retrofitting one across all of them would be a
// bigger change than the value justifies. If you write a new harness, exit
// non-zero on failure and this file needs no edit.
//
// NOT INCLUDED: firestore-rules.test.mjs. It needs the Firebase emulator (a CLI
// and a JVM), and README already records it as known-wrong against rules v2.x —
// it seeds roles as auth-token claims and the rules read staff/{uid} documents.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';

// HERE is tests/. ROOT is the repo root, one level up, where every shipped
// file lives. Keep the two apart: mixing them up is how the move breaks.
const HERE = fileURLToPath(new URL('./', import.meta.url));
const ROOT = fileURLToPath(new URL('../', import.meta.url));

// Fast: runs with no arguments in a fresh checkout, nothing external to fetch.
// ⚠️ metadata-map-test.mjs is the one exception to "well under a second" — it unzips
// the 24 books in library/ and takes ~3s. It is here rather than in EPUB below because
// it guards a regression that shipped for six versions unnoticed, and a guard that
// only runs behind a flag is a guard nobody runs. Its synthetic half still passes with
// library/ absent.
const FAST = [
    ["undefined-calls-test.mjs", "every identifier reference resolves: 13 JS files + 3 inline HTML scripts"],
    ["metadata-map-test.mjs",     "EPUB source/license map onto real dropdown options; Gutenberg origin"],
    ["reanchor-test.mjs",         "progress survives a re-upload: clamp, anchor search, staleness ladder"],
    ["credits-scroll-test.mjs",  "end-of-book credits reel: rises into view, holds, shows every row"],
    ["canvas-clear-test.mjs",     "the per-frame clear always covers the whole canvas"],
    ["title-case-test.mjs",       "Roman numerals survive title casing; words are not mistaken for them"],
    ["student-flow-test.mjs",     "a cold-start student gets assigned, stamped and reportable"],
    ['verify-guards.mjs',        'flush re-entrancy guards at 2/3/6/12 concurrent callers'],
    ['progress-test.mjs',        'library progress bar, including its degradation paths'],
    ['ordinal-test.mjs',         'body ordinals on modern and legacy documents'],
    ['map-geometry-test.mjs',    'Adventure dot placement across real book sizes'],
    ['credits-test.mjs',         'Classic end credits: structure and injection'],
    ['credits-binding-test.mjs', '⚠️⚠️ ROADMAP 48 — A CREDIT LABEL MUST NAME THE PERSON IT SAYS. "Text prepared by" read `cleanedBy` at THREE sites (About panel, classic credits, adventure credits) and cleanedBy is "Claude" on every book, so every book credited Claude with preparing the text; on the About panel it was ALSO a duplicate of the correct row beside it. And `preparedBy` was never projected into allBooks at all, so the correct row had NEVER rendered since v3.6.3. ⚠️ Asserts the label→field PAIRING, never presence — "does the string appear" passed on the broken build for eleven versions. Parts C and D are CLASS guards: every field a surface reads must be carried by the thing that feeds it'],
    ['credit-test.mjs',          'library card attribution: structure and injection'],
    ['card-markup-test.mjs',     'card markup survives the HTML parser intact'],
    ['about-test.mjs',           'detectAbout() and the completeness dot'],
    ['about-render-test.mjs',    'About panel segments, headings, credit injection'],
    ['anon-ladder-test.mjs',     'guest login ladder: rungs, the no-third-prompt rule, coalescing guards'],
    ['hud-test.mjs',             'the shared time readout: layout, goal denominators, one formatter only'],
    ['variety-floor-test.mjs',   'the shared missed-character variety filter behind both practice buttons'],
    ['week-anchor-test.mjs',     'the report audit and the app agree on where the school week starts'],
    ['class-week-anchor-test.mjs', '⭐ ROADMAP 58 STEP TWO: the class-editor wiring for a per-class week anchor — admin.html’s picker, saveClass()’s deleteField() scoping and cache-sentinel guard, startClassEdit()/cancelClassEdit(), the class → school-default → 6 ladder in both game.js and learn.js’s loadGoals(), and reports.html’s resolveWeekAnchor() no-modal mismatch/tie-break logic'],
    ['class-create-test.mjs',    'class name matching and the shared CSV class-creation path'],
    ['class-teacher-editor-test.mjs', '⚠️⚠️ ROADMAP 62 — the admin-only teacherUids editor: _canReassignTeachers() run against four roles, saveClass()\u2019s gate, the reveal/hide wiring, the orphan-class flag, and one shared getDocs(\u2018staff\u2019) rather than two'],
    ['csv-export-date-test.mjs', '⚠️ ROADMAP 66 — the books CSV export names its file from a LOCAL day (daylog.js’s localDateStr()), not toISOString()’s UTC one, which rolled the filename over as early as 6-7pm Central'],
    ['finished-book-test.mjs', '⚠️ ROADMAP 67 — a finished book must leave the Continue-reading row: isFinished() prefers game.js’s explicit finishedAt stamp and falls back CONSERVATIVELY for books finished before it existed (last body chapter AND completed, never a completedChapters count — front matter pads that array), renderBooks() stays untouched, and the completion path flushes explicitly because neither pagehide nor the gated hidden-flush can carry it'],
    ['game-shell-test.mjs',      'the game timing rule. ⚠️ PRESSURE ≥ 1.0 OR EVERY GATE IS UNREACHABLE — a push rate under the gate caps achievable WPM under the gate, because the clock is wall-clock and waiting for a spawn is charged. Part A pins that arithmetic; Part J pins that the finger map is keyboard.js’s and not a second copy'],
    ['lesson-game-layout-test.mjs','A LESSON RUN AND AN ARCADE RUN ARE THE SAME GAME ON THE SAME PLAYFIELD. Jake, watching a student: “the game is a mess due to the layout that’s there... nigh impossible for students.” IT WAS NOT A DIFFICULTY PROBLEM, IT WAS AN ASPECT RATIO: learn2.html gave Deadline a full-width uncapped body, ~2380x521 on his screen — a 4.6:1 strip against the arcade’s 816x581, or 1.4:1 — so words spread across 2.9x the horizontal distance a student scans, in a strip less than half as tall. AND EVERY NUMBER IN THE GAME COMES FROM THE PLAY CANVAS’S OWN W: lane positions, dome radii, spawn spread. arcade.html’s own comment records that Round 91 shrank the dome radius for looks, silently ended the three-deep overlap, and IT LOOKED COMPLETELY FINE. So this pins the two grids together, because if they drift then a lesson run and an arcade run stop being the same difficulty and the premise printed on arcade.html — type the same run in School and see whether the numbers line up — is void, invisibly: both pages render, both games play, only the numbers quietly stop meaning the same thing. PART D IS RULE 11: Jake’s screenshot had the top bar reading Acc 94 and the game’s footer reading 95, same instant, same screen. The formulas were character-for-character identical; THE DENOMINATORS DIFFERED — the page divided by the lesson step clock, the game by its own. Mutation-verified six ways, including reinstating the exact layout from the screenshot'],
    ['game-slot-test.mjs',        'DEADLINE REACHES EVERY LESSON IT SHOULD, PROVED AGAINST THE REAL 47-LESSON CORPUS — Rule 10 in the strict sense: it FAILS against the code that shipped, where 15 lessons silently got no game. The line that cost them read `if (!g || g.minWPM == null) return runs;` and run-grade.js returns a null minWPM for every DRILL_TYPE on purpose, because speed on random letter groups measures nothing — so all of Units 1, 2 and 5 were refused, which is exactly Jake’s "more than 4 keys but not passages" case and where most of a middle school sits. THE FIX IS THAT THE PACE AND THE GRADE ARE TWO DIFFERENT NUMBERS (his ruling, Option 1 of four): pace the falling words from the lesson’s own minWPM, keep grading on accuracy alone, keep the 4-key floor. PART C IS THE ONE THAT PROTECTS CHILDREN WHO CURRENTLY PASS — if it goes red the build has silently become Option 2, where a replaced Unit 1 drill is graded on speed it was never graded on, and students who pass today start failing. PART B ASSERTS UNIT BY UNIT, NOT AS A TOTAL: "46 of 47" reads the same whether the misses are scattered or three whole units, and those need opposite responses. Mutation-verified four ways'],
    ['escape-peek-test.mjs',      'THE SPAWN TELEGRAPH, BY ARITHMETIC RATHER THAN BY EYE — and it exists because Jake reported the SAME SENTENCE TWICE. The kaiju leaned backwards out of the board entering from the right; Round 112 shipped a fix and the fix was correct about what it changed. TWO BUGS WERE CANCELLING: drawPixelSprite() mirrors the rotation along with the sprite, and the call site passed a FIXED lean = 0.5 — but a lean that points along travel is +0.5 from the left edge and -0.5 from the right, and while the mirror was flipping the angle the flip and the lean were CORRELATED (both derive from dir), so the wrong constant looked right on both edges. Removing the mirror left it naked, and Round 112 reported success truthfully about the code and falsely about the screen. THE TELL WAS THREE LINES ABOVE THE BUG: the blast tilt was already signed by dir. THIS HARNESS ACCUMULATES THE REAL 2x3 CANVAS TRANSFORM and asks where the top of the sprite lands, because an angle whose correctness depends on a scale() two files away cannot be settled by reading either file; Part C pins the screen-angle contract SEPARATELY. TWO DRAFTS WERE WRONG FIRST, both by measuring the ARTWORK instead of the transform — the kaiju is not left-right symmetric, so mirroring moves any bands average x on its own, and Part A passed on draft one PARTLY BY LUCK. It now uses a symmetric probe bar whose expected skew is computable by hand. DO NOT switch it back to the real sprite'],
    ['run-picker-test.mjs',       'A STUDENT COMES BACK AND LANDS WHERE THEY LEFT OFF — the feature Jake asked for, that was BUILT AND WIRED AND COULD NOT FIRE FOR ONE SINGLE STUDENT. Two independent reasons, both of which look like careful engineering: maxReachableRunIdx() refuses the shortcut when the stored runCount differs from the live run count (correct — lesson-gate.js keys mastery BY INDEX, so a re-chunked lesson must refuse), but attachGameSlot() APPENDS a Deadline run, so learn2 counts one more than learn.html and EVERY RECORD THE PRODUCTION PAGE EVER WROTE LOOKED STALE; and the opening run came from firstOpenRunIdx() alone, which advances only for a MASTERED run — 4 points, banked at 2 for a fireball and 1 for an A, with B, C, D and F worth ZERO, so a child passing runs 1-4 with Bs and Cs banks nothing. THE TWO FEATURES DISABLED EACH OTHER and every harness in the repo stayed green, because neither piece is wrong on its own. THE SHAPE TO REMEMBER: a correct guard firing on a difference that means nothing. Part A is Rule 10 in the strict sense — built from the record shape recordRunOutcome() really writes, and it FAILS against the arithmetic that shipped. PART C STOPS THE LAZY FIX: deleting the staleness guard makes Part A pass and is worse than the bug; mutation-verified three ways'],
    ['escape-board-test.mjs',    '⚠️⚠️ Escape Key’s board: THE CAMPER DIES and THE HUNTER ACTUALLY APPEARS. Both took several drafts that each looked fixed — the camper survived 36/40, then 38/40, then 1/40; the hunter was unreachable in an assessed run for two rounds behind a passing test that hand-set the pressure unlocking him'],
    ['arcade-mount-test.mjs',    '\u26a0\u26a0 THE FIRST HARNESS THAT ACTUALLY RUNS A GAME VIEW, and it found a defect in its first minute. HANDOFF rule 2, written after arcade.html shipped blank at 93/93: A GREEN SUITE DOES NOT MEAN THE PAGES LOAD. module-parse-test closed the parse half; arcade-panels-test closed the panel-drawing half. \u2b50 NEITHER HAD EVER CALLED mount(), so nothing in this repo had executed a frame loop, an input path, a spawn or a teardown. What that cost: game-chrome.js declared `pauseKey` INSIDE showReady() while destroy() removed its listener at MOUNT scope \u2014 so EVERY teardown threw a ReferenceError and every statement after it was skipped, including the canvas removal and board.destroy(), and arcade.html destroys and re-mounts on every launch, so switching cabinets stacked a dead canvas each time. And showReady() runs again on every restart, so Escape called setPaused() twice per press: pause-to-pause STOPPED WORKING after the first play-again, which is the precondition Jake asked for the hover card to hang off. \u26a0 It types BLIND \u2014 it sprays the alphabet and never learns a single game rule, because how a word splits belongs to shatter-board-test and what a keystroke is worth belongs to game-shell-test. \u26a0 Its first draft waited 60ms for a 3000ms countdown and went red against perfectly good code; COUNTDOWN_MS is imported now, never guessed'],
    ['arcade-pool-test.mjs',     '⚠⚠ DOES EVERY LEVEL IN THE COURSE GET A BOARD ESCAPE KEY CAN DEAL? Two good rules collide and something had to decide which wins per level: Jake’s “choosing a specific level should decide what characters are available”, and HANDOFF §7 item 2’s “wire word-banks.js in, because letter groups read as nonsense”. ⚠⚠ THEY CANNOT BOTH HOLD AT UNIT 1 — the home row spells FOUR bank words in total, so “real words restricted to your keys” is an EMPTY POOL, and an empty pool in Escape Key is a board of blank cells with nowhere to move. The rule is one sentence: real words when the level’s keys supply enough, letter groups when they do not, walking DOWN in length before giving up on words. ⭐ PART C IS THE ONE THAT MATTERS: it walks the real unlock order one lesson at a time and asserts every level deals four adjacent cells with distinct first letters — a gap in the middle is a silent dead arcade for whichever class stands on it that week, with nothing thrown and nothing logged. It also asserts the upgrade ACTUALLY HAPPENS (7 of 9 levels reach real words) and never regresses, because a module where every level fell back to letters would be a no-op that passed its own tests. ⚠ PART D pins the seam at BOTH ends — a provider the board ignores is the exact shape of Escape Key’s twenty-round dead tick, wired at one end with nothing consuming it at the other — and pins that a board given NO provider is unchanged byte for byte, which is the path escape-board-test’s 39 assertions all run'],
    ['shatter-board-test.mjs',   '⚠⚠ SHATTER’S SPLIT, AND THE FACTOR OF TWO THAT WOULD HAVE FAILED EVERY CHILD. A student types `unusually` to break the rock and then types `un`, `usual` and `ly` — the pieces spell the word, so ONE TARGET IS 2N KEYSTROKES. Priced at N it demands 30 WPM of a child on a 15 WPM gate, and it reads as correct: the same shape as Round 82’s MISSION_PRESSURE = 0.75, which made every gate in the building unreachable. Part B pins the arithmetic so it cannot return as a readability tweak. ⭐ THREE MORE REAL DEFECTS THIS FILE CAUGHT AND A REVIEW WOULD NOT: `reassuringly` splits into re|assuring|ly and `assuring` trips drill-filter.js — splitting is a NEW WAY TO MAKE A SHORT STRING OUT OF A SAFE LONG ONE and every filter this app owns had only ever seen the whole word; the arcade ramp fired once per ROCK where RAMP_PER_TARGET is priced per TARGET, so a child typing at exactly the gate with 100% accuracy lost every shield at 79 seconds on their own success; and two of the three pieces of `unusually` start with `u` at the same distance, so nearest-to-impact cannot break the tie and a kid who meant `usual` was charged a mistake for the game’s ambiguity. ⚠ PART G’S CLAIM IS COMPARATIVE ON PURPOSE — my first draft demanded a gate-speed child survive three minutes of ENDLESS arcade, which is the mistake escape-board-test’s mover test made TWICE: an endless run has no quota, the ramp climbs forever and IS SUPPOSED TO WIN, so “survives N seconds” measures the ramp and not the game. It now asserts the split never SHORTENS a run against the same board with splitting off'],
    ['escape-seconds-test.mjs',  '⚠⚠ THE OTHER END OF ESCAPE KEY’S SEAM. game-names.js has declared countsTime: true for Escape Key since Round 82 — Jake’s 4e ruling, “time typed should still count” — and game-escape.js v1.0.0 accepted no onSecond at all, so every minute a student spent in it was unbankable by any host and NOTHING WENT RED, because no harness had ever asked whether this view emits a second. ⭐ Deadline shipped the identical defect and the lesson was already written down: arcade-lesson-test pinned the PAGE’s listener and stayed green for ten rounds while nothing emitted. Escape Key had NEITHER end asserted. Pins the four mistakes Deadline made — the call missing from the frame loop, the permanently-false `!ended` guard, a private dt accumulator instead of d.clock.seconds() (worse here: frame()’s dt is CLAMPED to 50ms, so accumulating would under-bank every hidden tab), and a secondsBanked that survives restart() and swallows the replay’s opening seconds. ⚠ STRUCTURAL, NOT BEHAVIOURAL, and the file says so: green means those four are absent, NOT that a minute banks — only a browser proves that. ⚠ Rule 10 checked: 11 of 19 assertions FAIL against the pre-fix file. ⚠ Comments are stripped, and this file needs it most — it quotes the permanently-false guard it forbids'],
    ['game-assumptions-test.mjs','⚠️ THE SEAM, NOT THE GAMES. Asserts the repo claims the games rely on and do not own: learn.js’s netWPM/accuracyPct arithmetic (Rule 11), that secondsToday has exactly ONE increment site with no subtract path, that gatesForRun still returns null minWPM for drills, and that the games are still inert. ⚠️ Part H is the inertness assertion — invert it DELIBERATELY when the wiring lands'],
    ['arcade-lesson-test.mjs',   '⭐ ROADMAP 68 — arcade.html plays a REAL lesson run at its REAL gates. ⚠️⚠️ Part C is the load-bearing one: runPlan()’s chunk boundaries must agree with the real sequence’s, or “Run 4 of 6” on the arcade page is not run 4 in School and every comparison Jake collects is off by a run. Part B guards the three cases of learn.js’s buildSequence() the page had to duplicate (it is not exported and a standalone page cannot import it) by lifting BOTH and comparing character for character. Part D pins that the page still writes nothing. ⚠️ Comments are stripped before structural checks — the page’s own “DO NOT ADD A typing_logs QUERY” warning otherwise reads as the violation it warns against'],
    ['module-parse-test.mjs',    '⚠️⚠️ EVERY SHIPPED MODULE ACTUALLY PARSES. game-chrome.js v1.3.0 shipped to a classroom with a backtick inside a CSS template literal — the browser said SyntaxError naming a CSS property, and NOTHING here caught it: node --check parses a .js as a SCRIPT and the wreckage was script-legal, so the runner reported \u201c0 syntax failures\u201d, and all 87 harnesses passed because every one of them reads these files as TEXT rather than loading them. This strips module syntax and hands the body to the real parser. Proves parseability, not correctness — but that floor was missing'],
    ['arcade-panels-test.mjs',    '⭐ THE SIDE PANELS ARE RUN, NOT READ. Every other arcade harness reads these modules as TEXT, and that has already let two defects reach a classroom — a backtick in a CSS template literal (all 87 harnesses green, page dead) and a splice that left a function unterminated (both side canvases simply blank, every harness passing). module-parse-test closed the PARSE half; parsing is not drawing. This calls drawRadar(), drawGauges() and drawSevenSeg() against a recording 2D context and asserts GEOMETRY, because a regex cannot tell you the DOME ring ended up above the SCREEN ring. ⚠⚠ Part B is Rule 10 in the strict sense: B4 FAILS against the shipped Round 95 fade (the defect Jake reported as “each word fades out the whole grid”) and passes against the fix. Mutation-verified four ways — the fade restored, the rings swapped, the preview clamped onto the screen ring, and a gate invented for an ungated drill. ⚠ Every assertion is a RELATIONSHIP, never a pixel literal: game-layout.js exists to be edited, and a width assertion would go red for a reason that is not a defect'],
    ['arcade-versions-test.mjs', '⚠️⚠️ THE ARCADE FILES STAMP THEMSELVES HONESTLY. Four of them spent ten rounds with bumped headers and constants frozen at 1.0.0, and game-layout.js shipped with no constant at all — they fell in the gap between two correct decisions (README\u2019s bump-both rule, and Jake\u2019s ruling that the arcade stays out of versions.js while it is a draft), so nothing checked them. Discovers the files rather than listing them. ⭐ DELETE THIS when they join versions.js and let version-stamp-test own them — two answers to one question is worse than none'],
    ['staff-role-editor-test.mjs', '⚠️⚠️ ROADMAP 65 — the missing \u2018super_admin\u2019 option in the role dropdown, the pre-select bug it caused on an existing super_admin, and the demotion confirm() guard, checked in the right order relative to the self-edit refusal'],
    ['roster-filter-test.mjs',   'Students-tab date range: the Saturday week boundary and the status line'],
    ['sort-test.mjs',            'library sort keys against the real author strings in library/'],
    ['search-test.mjs',          '⭐ ROADMAP 53: the library search box — matchesSearch()\u2019s title/author substring match (not run through the sort-key folding), its place in renderBooks()\u2019s combined filter pass alongside genre/age/protagonist, and the .filter-search markup/CSS kept separate from .filter-select\u2019s cursor:pointer'],
    ['popularity-sort-test.mjs', '⚠️⚠️⚠️ ROADMAP 54 — v1.0.0 OF THIS FILE ASSERTED THE BUG AS A REQUIREMENT. It pinned a per-book filter on `typing_logs`, and that collection has no such field and cannot: it is keyed {uid}_{date}, one merged rollup per student per DAY, so a child who reads two books in a period has one document with no single book to name. The query matched nothing, eighty zeros were written to settings/popularity, and sortBooks() fell through to its title tiebreak — Jake read the result as “just alphabetical” and he was reading it correctly. Every one of the 27 assertions was green throughout, because each compared the code against an expectation invented in the same session as the code: Rule 10 in one sentence. ⭐ PART E IS THE REPAIR AND IT IS A RATCHET — it derives the fields typing_logs writers actually write, by brace-matching the four setDoc() payloads and CALLING daylog.js’s two builders on both sides of the source-split cutover rather than mirroring a list, then refuses any filter on this page naming a field outside that set. Mutation-verified twice: with the old query restored, and with `date` renamed to an invented field, to prove it guards the class and not the keyword. ⚠️ Also pins the count’s new source (users/{uid}/progress, one doc per student per book, no index or rules change needed), that an unreadable student is a MISS and never a zero, that the dry run contains no setDoc, and that index.html now SAYS SO when it has nothing to sort by — the silence is what let this survive a round'],
    ['lesson-atomicity-test.mjs','lesson restart-on-incomplete, and the constants game.js and learn.js share'],
    // ── promoted out of PENDING when the concurrent round's code landed ──
    ['session-merge-test.mjs',   'the guest/expired merge, session-log rollup dating, the repair resync, and Part E: two concurrent flushes write ONE document'],
    ['open-unit-test.mjs',       'the open sprint/run: deltas, watermarks, and the reset-site parity guard'],
    ['source-split-test.mjs',    'legacy-FIRST daily-log reads (the split is reverted), splitSessionTotals(), and sessionSignature() duplicate detection'],
    // ⚠️ Round 23 (Empire): reconcile-test.mjs and union-clock-test.mjs were
    // DELETED here, in the same commit as the reconcile tool they covered. The
    // registration audit caught the attempt to remove only one half. The real
    // production session documents union-clock-test.mjs held were lifted first
    // into real-sessions-fixture.mjs — ROADMAP item 2 required that, and item 1
    // needs them.
    ['daylog-test.mjs',          'ONE NUMBER: the shared typing_logs week reader \u2014 Saturday anchor, legacy-first totals, and the partial-read refusal'],
    // ── Round 21 (Hammond): were in NO list. See the v1.4.0 note above. ──
    // ⚠️ REWRITTEN IN ROUND 22 (v2.0.0). It no longer reproduces §3.1 — it GUARDS
    // THE FIX, and it fails properly now instead of reporting a loss as expected
    // behaviour. Its old Part C modelled per-source DOCUMENT ids, which the
    // deployed rules DENY (HANDOFF §0.-5.B): six rounds of green there meant
    // only that the author's idea was self-consistent. Its Part A reads the real
    // files and is the assertion that would notice §3.1 coming back.
    ['crossmode-overwrite-test.mjs', 'ONE DOCUMENT, TWO WRITERS: \u00a73.1 CLOSED. Part A is the guard \u2014 neither page may name the other source\u2019s fields in a Firestore payload, ever'],
    ['week-agreement-test.mjs',  'Rule 11 date agreement at all 24 hours \u2014 run as TZ=America/Chicago for the real check'],
    // ⚠️ ROADMAP Phase B step B1. Written test-first and RED against daylog.js
    // v1.1.0 — it could not even import. Green from v1.2.0. Its Part F LIFTS
    // readLogTotals() OUT OF reports.html and drives it against daylog.js's
    // totalsOf(), so the student's reader and the teacher's reader cannot drift.
    // ⚠️ The ⟳ button is the only destructive control in reports.html reachable
    // in one click. Until v2.23.0 it had no limit on how far down it could move
    // a day, and the session record it rewrites from is NOT a superset of the
    // day counter. Real 2026-08-19 evidence is in the harness header.
    ['recalc-guard-test.mjs',    'the \u27f3 drop guard: small corrections stay silent, a big down-move needs a confirmed yes, and the delete path is exempt'],
    ['daylog-cutover-test.mjs',  'the per-source cutover: pre-cutover days read EXACTLY as before, post-cutover days sum flat + splits, and reports.html carries the identical gate'],
    ['tab-lifetime-test.mjs',    'THE MISSING AXIS: two controllers over one shared document across real tab orderings. \u26a0\ufe0f Parts B/C/F assert the CORRECT totals and choose their controller by READING game.js/learn.js, so they go RED on a build without the writers'],
    // ⚠️ Round 23 (Empire). The session queue was ONE slot holding ONE uid, so a
    // second student signing in on the same Chromebook destroyed the first's
    // unflushed sprints at their first five seconds of typing. Every READ was
    // uid-scoped; `_write()` was not. Mutation-verified: 8 failing against
    // session-log.js v1.4.0.
    // ⚠️ Round 23 (Empire). THE GUEST MINUTE, and the numbers are Jake's own:
    // School guest 1:04 -> 8:31 (merged), Library guest 1:11 -> 8:31 (lost).
    // game.js had no guest merge on the auth path; the merge existed twice
    // inline in two modal paths, so which of three sign-in buttons a child
    // pressed decided whether their minutes survived. 11 failing against
    // game.js v3.35.0 / learn.js v2.20.0.
    ['guest-merge-test.mjs',     'THE GUEST MINUTE: time typed before signing in is merged AND flushed AND lands in the session record, in BOTH modes'],
    ['live-period-test.mjs',     'THE STALE DAY: a tab open overnight must not post yesterday\'s whole day to today\'s ledger line'],
    ['hud-lead-test.mjs',        'THE GRADED NUMBER DOES NOT MOVE: Daily is the LEAD row of the top bar on every surface'],
    ['celebration-test.mjs',     'NOT EVERYONE GOT FIREWORKS: a goal crossing missed in one mode must fire in the next, once'],
    ['done-button-test.mjs',     "I'M DONE IS A RECEIPT: it files the open sprint and flushes, and nothing may ever gate on it"],
    ['queue-owner-test.mjs',     'ONE BROWSER, TWO STUDENTS: a second account may not destroy the first\u2019s unflushed queue, by push, by flush or by eviction'],
    // ⚠️ Round 46 (Rem-Sho), ROADMAP item 24 \u2014 the writer half. addDoc()
    // minted a random id on every flush, so a chunk resent after a killed
    // pagehide (or a silently-failed local removal) became a NEW, larger
    // document instead of overwriting the old one \u2014 12 of 51 student-days,
    // measured. The fix is a derived document id + setDoc(), so a resend
    // overwrites. Ships with firestore.rules v2.8.0 (owner update rights) \u2014
    // this harness cannot see the rules; run npm run test:rules before deploy.
    // ⚠️ §READS — readWeek() was 65% of every read in a measured student session,
    // and game.html read the same week twice per load. The memo removes the
    // duplicate; Part C is the load-bearing half, asserting every typing_logs
    // writer drops it, because a stale memo paints a short total mid-load.
    // ⭐⭐ ROADMAP 28 — the measured win: closed days are read once a day, not
    // once a page load. ⚠️ Part B is the boundary that carries the risk
    // (yesterday is never cached — the Overnight Rescue writes back into it),
    // and Part D is the never-under-read contract.
    ['closed-day-cache-test.mjs', 'A CLOSED DAY IS READ ONCE, NOT ONCE PER PAGE LOAD: today and yesterday are always live, the cached week totals identically, and an expired, foreign, corrupt or faulted cache falls back to reading'],
    ['weekly-memo-test.mjs',     'ONE WEEK READ PER PAGE LOAD: the memo dedupes the double read, never caches a failure, hands every caller its own copy, and EVERY typing_logs writer drops it'],
    ['session-writer-test.mjs',  'THE WRITER: a resent chunk overwrites its own document instead of duplicating it, whether the page was killed or the local removal itself failed, and two different chunks never collide on one id'],
    // ⚠️ Round 31 (Fitch), ROADMAP 14b. The time was banked on the way out of a
    // lesson and the RUN was not, because stopLesson() reloaded progress and
    // loadUserProgress() opens by emptying userProgress — so the scheduled
    // flush wrote back the record it had just re-read, successfully. Part A
    // drives the OLD exit and must keep losing runs; it is the only thing that
    // proves the other five parts are measuring something.
    // ⚠️ Round 33 (Crandall), ROADMAP 11. Jake's own son was in his class and not
    // his school for three rounds. TWO bugs in TWO files and fixing either alone
    // fixes nothing visible — the writer omitted schoolId, and the reader cached
    // "no class" for 24 hours. Part C is the one that matters most: a fix reading
    // _classCache directly would have looked right and written '' exactly as the
    // bug did, because that cache is cold until the Classes panel is opened.
    // ⚠️ Round 34 (Molle), ROADMAP 14's student-facing half — and the harness
    // learn.js had CITED IN ITS HEADER SINCE ROUND 32 WITHOUT IT EXISTING. Part A
    // is Jake's own bug, found by using the feature: with run 1 mastered the
    // student had to replay it for nothing to reach run 2.
    ['roadmap-index-test.mjs',   '⚠️⚠️ THE ROADMAP INDEX MUST DESCRIBE THE DOCUMENT. Jake could not navigate ROADMAP.md; Round 41 indexed it and I let the index go stale within THREE ROUNDS — item 22 closed and still listed open, item 24 still carrying a warning after the fix. An index that lies about status is worse than none, because a reader trusts it INSTEAD of the file. Checks agreement, not truth'],
    ['im-done-test.mjs',         '⚠️⚠️ ROADMAP 25 — "I’M DONE" MUST NOT STAMP A CHILD A NUMBER SMALLER THAN THE HUD THEY WERE JUST WATCHING. learn.js’s flush gate ignored its own `final` argument, so every press mid-run wrote NOTHING and the receipt read a stale typing_logs. ⚠️ A TWIN DIVERGENCE WHERE THE SIBLING WAS ALREADY RIGHT — game.js gated on `!walDirty && !final`. This harness drives BOTH files and asserts they agree'],
    ['remediation-test.mjs',     '⚠️⚠️ A PRACTICE DRILL IS NOT A RUN OF THE LESSON: the 🎲 Practice-missed-keys drill borrows the lesson’s engine and used to be GRADED as its run 1 — a clean 83-character random drill scored A🔥, passed a 12-run lesson and wrote runCount: 1 over its count. ⚠️ Part C is the half that is NOT ROADMAP 10: the minutes still count in BOTH records, only the assessment is suppressed'],
    ['run-grade-test.mjs',       '⭐ ROADMAP 15 — THE GRADE RULE AND THE RECONSTRUCTION. ⚠️ Part D is the ratchet: runPlan() computes the run list from SHAPE ALONE (two step types generate their characters at random) and must agree with learn.js’s real generators on run count, or reports.html grades the wrong material. Also: fragments of one interrupted run merge before grading, and a drifted runCount REFUSES rather than guesses'],
    ['run-mastery-test.mjs',     '⚠️ THE STUDENT CAN REACH THE RULE: a lesson opens at the first run that still counts, both intro entry points honour it, the mode is armed per run before the drill shows, and the score is visible'],
    ['class-assign-test.mjs',    '⚠️ A STUDENT IN A CLASS BUT NOT A SCHOOL: every assignment writer carries the building, one answerer looks it up, it survives a cold cache, and an unassigned student is never a cacheable answer'],
    ['busy-state-test.mjs',      '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 41 \u2014 A SLOW CONTROL LOOKS BUSY AND ALWAYS COMES BACK. One withBusy() helper around Generate, \u26d1 regrade, \u27f3 recalculate and \u2298 clear-mastery. \u26a0\u26a0 THE DISABLE IS CORRECTNESS, NOT COURTESY: three of the four WRITE, and a teacher who thinks a button did nothing clicks it again. \u26a0\ufe0f Part A2 pins the finally \u2014 recalc-btn used to re-enable on the line AFTER its await, so any throw left it dead until reload. \u26a0\ufe0f Part D asserts scanForFlags() is deliberately NOT converted: it reports per-student progress from inside a loop, which a wrap-the-call helper cannot express'],
    ['inline-styles-test.mjs',   '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 42 \u2014 THE EXTRACTED STYLES STAY EXTRACTED AND THE UTILITY BLOCK STAYS LAST. admin.html carried 276 inline style= attributes against reports.html\u2019s 33, which is why it resisted items 37\u201341: no stylesheet to edit, so every visual change meant hunting through markup. 834 of its 866 declarations were moved into utility classes. \u26a0\u26a0 PART D IS THE ONE THAT MATTERS: the utilities are SINGLE-class selectors, so against .lbtn / .l-field / .col they tie on specificity and win only on SOURCE ORDER \u2014 69 declarations silently revert if a rule is added below the block, with nothing on screen to say so. \u26a0\ufe0f Part C pins the 32 declarations that must NOT be extracted, and two of them are traps: #tab-staff and #build-list are restored with .style.display = \u2018\u2019, which falls through to the stylesheet \u2014 class-ify their display:none and the Staff tab never appears again. \u26a0\ufe0f Part C4 records that the suppressed :disabled rule is real: admin.js DOES disable auditBtn and saveTitleBtn for slow work, so ROADMAP 41 is not merely undone on admin but DEFEATED there. \u26a0\ufe0f Part B\u2019s first draft banned hex in markup outright and went red against correct code \u2014 13 of the retained declarations ARE colour'],
    ['staff-tokens-test.mjs',    '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 37+38+40 \u2014 THE STAFF PAGES USE THE TOKENS AND A COLOUR MEANS ONE THING. reports.html carried 33 distinct hex values and admin.html 51, neither loaded the product font, and amber meant three different things across the two. \u26a0\u26a0 Part C is the one that matters: NO raw hex outside :root, in the style block OR the JS half, because an inline style= built in a template string is as unsystematic as a rule and harder to find. \u26a0\ufe0f Part B pins that both pages agree on every shared token \u2014 there is no shared stylesheet to enforce it. \u26a0\ufe0f Part E: role and tabindex TOGETHER on interactive spans, and Enter/Space actually activating them. \u26a0\ufe0f Comments are stripped before counting \u2014 the first draft failed against correct code by reading its own explanation as output'],
    ['progress-cache-test.mjs',  '\u26a0\ufe0f\u26a0\ufe0f\u26a0\ufe0f ROADMAP 43 \u2014 THE PROGRESS CACHE IS NEVER WRITTEN BEFORE IT IS READ. refreshProgressCache() used to persist whatever userProgress held; loadUserProgress() sets it to {} then AWAITS the network, so an ordinary tab switch inside that window saved an EMPTY MAP as the student\u2019s record. `{}` then passed the typeof-object cache-hit test, Firestore was never consulted, and isUnlocked() offered lesson one and nothing else for up to eight hours \u2014 with the server record and their typing time both perfectly intact. \u26a0\u26a0 Part B4 asserts the INVARIANT (exactly two write sites, one of them guarded), not the call sites. \u26a0\ufe0f Part D is the SELF-HEAL: empty-is-a-miss repairs already-poisoned caches on the next page load, which is the only repair a student without a console can receive'],
    ['clear-mastery-test.mjs',   '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 33 \u2014 CLEARING MASTERY UNDOES THE GATE, NOT THE HISTORY. runScores and runLocks go together (points without the stamp unlocks the lesson while the reach-back clock still says the child proved something); runGrades/runFires/runAttempts survive. \u26a0\u26a0 deleteField(), NEVER an empty map \u2014 an empty map falls through to runScoreOf()\u2019s legacy seed and re-awards points from best-ever grade. \u26a0\u26a0 users/{uid}.lastLockDay is re-derived from the surviving maximum AFTER the write, because it is the global clock for every lesson. \u26a0\ufe0f masteredRuns() is NOT runMastered() \u2014 that one is prefix-closed and would report every run as mastered the moment the last one was'],
    ['day-flags-test.mjs',       '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 36 + 32 \u2014 THE DAY ROW SAYS WHAT HAPPENED WITHOUT BEING EXPANDED. The error-rate column is FREE (typing_logs already carries `mistakes` beside `chars`); the flag icons cost reads and live behind a scan button that asks first. \u26a0\u26a0 THE ASSERTIONS THAT MATTER: \u201cno answer\u201d is NEVER rendered as 0% (a clean green zero on a day with no typing lies in the direction nobody checks), and \u201cnot scanned\u201d never looks like \u201cscanned, clear\u201d. \u26a0\ufe0f Part G is the per-run delete: identified by sprintIdentity() and never by array index, rollup recomputed in the same write, and the confirm admits it does NOT clear mastery (item 33 is still open). \u26a0\ufe0f These helpers were scoped inside renderTable() on the first attempt \u2014 v2.24.0\u2019s defect verbatim; undefined-calls-test.mjs caught it'],
    ['hardstop-overlay-test.mjs', '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 49 \u2014 THE HARD-STOP OVERLAY AND ITS FLAG ARE ONE PIECE OF STATE. beginStep() cleared drillIsHardStop and left the DIV in the document, and the DIV\u2019s parent is static markup it never rebuilds \u2014 so a student who hit the hard stop and pressed \u21ba Restart got a fresh random drill under a red letter from the sequence just thrown away, demanding a key no longer in their text. Jake photographed it. \u26a0\ufe0f THE FLAG WAS FALSE BY THEN, so the drill underneath was LIVE AND SCORING under a 92%-white sheet \u2014 the app grading a run the child believed it was refusing. \u26a0\ufe0f Part A asserts the PAIRING at every site that clears the flag, not that beginStep() in particular removes it, because a third site appearing unnoticed IS the defect. \u26a0\ufe0f Caps Lock is deliberately untested: Jake ruled it the student\u2019s to learn, and \u201cforgiving\u201d it would make every capital-letter drill unfailable'],
    ['drill-paint-test.mjs',     '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 31 \u2014 EVERY MUTATION OF drillPos IS FOLLOWED BY A PAINT. The idle-resume space skip moved the position past a space and never repainted, so the space bar kept its two thumb circles while the game already expected the next letter \u2014 kids reported it and photographed it. \u26a0\ufe0f ASSERTS THE INVARIANT, NOT THE CALL SITE: this is the third position/paint divergence in learn.js, so the class is guarded, not the instance. \u26a0\ufe0f Part B only counts a painter at the mutation\u2019s OWN brace depth \u2014 a painter inside a `{ finishStep(); return; }` guard clause is on a branch and cannot paint the path that falls through, which is how the first draft passed against the real defect. Part D pins advanceHandGuide()\u2019s space guard, which was NOT the bug and must not be "fixed"'],
    ['exit-flush-test.mjs',      '\u26a0\ufe0f \u2190 MAP BANKS THE TIME AND THROWS AWAY THE RUN: the flush must beat the reload that empties userProgress, the cache must be refreshed between them, and an unflushed run must survive a failed write'],
    // ⚠️ Round 25 (Hall). A student reported "ass" in a School lesson. Part A
    // reproduces learn.js's generateRandom() over 200,000 groups and MEASURES
    // the rate rather than arguing it: 1 in 135 groups, 8.5% of drills. Part D
    // is the important one and is not about words at all — rejection sampling
    // on a key set where every outcome is blocked is a frozen browser in a
    // classroom, so the attempt budget is bounded and a group is always
    // returned. ⚠️ PART F1 IS PENDING BY DESIGN: learn.js does not import the
    // module yet. Flip F1 when the wiring ships.
    ['drill-filter-test.mjs',    'THE RANDOM DRILLS MUST NOT SPELL THINGS: rejection sampling that cannot bias the drill and cannot hang the browser. \u26a0\ufe0f F12 also guards style.css\u2019s body::before stamp'],
    // ⚠️ Round 27 (Chicago). The audit that already existed, moved INSIDE the
    // suite. `npm run audit:versions` had been reporting four files as "one of
    // the two is a lie" for a whole round and nobody ran it, because it is a
    // separate command. A guard outside `npm test` is a guard nobody runs.
    // ⚠️ Round 27f. The MIRROR of undefined-calls-test: that one asks whether
    // everything USED is DEFINED; this asks whether everything DEFINED is USED.
    // Written because "I'm done" shipped as a styled, visible, INERT button in
    // Library for a day — game.js defined handleImDone() and never attached it,
    // and 43 harnesses passed the whole time because none of them could fail.
    ['dead-handler-test.mjs',    '\u26a0\ufe0f NO BUTTON IS INERT AND NO FUNCTION IS ORPHANED: every function a page controller defines is referenced, every button in the markup is wired, and BOTH pages attach handleImDone'],
    ['version-stamp-test.mjs',   '\u26a0\ufe0f THE FILE MUST NOT LIE ABOUT ITS OWN VERSION: runtime constant vs header, both CSS stamps, and the three module pins. \u26a0\ufe0f v1.1.0 \u2014 header budgets are ENFORCED now rather than printed as notes: the line budget is PROPORTIONAL to file size and the entry budget is 8. Read the v1.1.0 block before demoting either'],
    ['build-panel-test.mjs',      '\u26a0\ufe0f THE BUILD PANEL DOES NOT SCOLD CHILDREN, AND DOES NOT LIE WHEN GAGGED: \u26a0 notes default OFF so a forgetful caller is safe, all three surfaces gate them explicitly, a SUPPRESSED note still prints its COUNT, ADMIN_EMAILS has exactly one literal home, and the renderer-drift alarm needs a real semver rather than the never-mounted sentinel'],
    ['continue-reading-test.mjs', '\u2b50 ROADMAP 19 \u2014 CONTINUE READING. \u26a0\ufe0f Section A is the one that matters: `lastUpdated` arrives as a Timestamp on a cold read and as a PLAIN { seconds } object after the eight-hour localStorage cache, and handling only the first ranks every card 0 for most of the school day \u2014 a row that still renders, in a meaningless order. Also: ranks on last-touched not percent complete, a deleted book falls out silently, and the card markup survives a real parser (no <a> inside the <a>)'],
    ['docs-vs-repo-test.mjs', '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 52 \u2014 THE DOCUMENTS MUST NOT LIE ABOUT THE REPO. Round 81 found FOUR places in one session where they did, and none could turn a harness red because no harness read them: item 42\u2019s count was stale by 170 and Round 80 passed it forward; item 58 said it needed a ruling Jake had already given, in the same item; item 30\u2019s premise was false; item 9\u2019s bullet described a shipped fix as open. Checks the MECHANICAL half only \u2014 document map vs disk, the START HERE stamps vs the files, the harness count vs the registry, and a ruling heading left standing over its own answer. \u26a0\ufe0f It found three real problems on its FIRST run (ROADMAP.md absent from the map, a row pointing at a deleted file, a stale learn.js stamp) \u2014 and three false alarms of its own, all fixed: read the header on why it must never cry wolf'],
    ['adventure-overlay-test.mjs', '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 30 \u2014 NOTHING IN ADVENTURE VIEW MAY SIT IN NORMAL FLOW BENEATH THE FIXED CANVAS. The Caps Lock warning painted correctly UNDER #adventure-canvas (position:fixed, z-index 5) for as long as Adventure existed, while its flow height went on pushing the bars below it down \u2014 so what a student saw was not the red bar but the white gap it opened. adventure.css skins classic elements by overriding paint, which is safe for everything inside #game-container and wrong for everything outside it. \u26a0\ufe0f Mutation-verified against BOTH the original bug and the plausible bad fix: a z-index with no position does nothing on a static element and looks like a repair'],
    ['featured-shelf-test.mjs', '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 53 + 69 \u2014 FEATURED IS A MIXTURE: a slot reserved for a new book drawn at random from inside the window, the rest the untyped discovery draw, all of it shuffled. \u26a0\ufe0f v1.1.0 PROVED THE NEWEST HALF WAS DETERMINISTIC, WHICH IS NOT THE SAME AS PROVING IT SHOULD BE \u2014 it was sort-by-uploadedAt then slice, no shuffle anywhere, so the same titles showed for a fortnight and Jake asked for it to move. B1\u2013B4 now describe a candidate SET rather than an order, and E5 is rewritten into the decision that superseded it rather than deleted. \u2b50 E8 IS THE ONE THAT EARNS THE STAMP\u2019S NEW-ID COMPONENT: a book replaced in a live tab (one pulled, one uploaded, length unchanged) must still earn the reserved slot, and without the re-roll the frozen pick can still point at the DELETED book \u2014 a card whose link 404s. \u26a0\ufe0f E7 CARRIES A NEGATIVE RESULT ON PURPOSE: it claimed to guard that component and mutation testing left it green, because the badge is derived fresh every render OUTSIDE the cache. Part F pins the two-up grid and reads the expected card count out of the CSS, since N cards in a fixed-column grid wrap the moment N exceeds the column count and nothing on screen says a JS constant disagrees with a CSS rule'],
    ['dialogs-test.mjs',         '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 39 \u2014 reports.html HAS NO BROWSER DIALOGS LEFT, AND A HALF-CONVERTED PAGE IS WORSE THAN AN UNCONVERTED ONE. `if (!confirm(x)) return;` is SYNCHRONOUS and a modal is not: an unawaited ttbConfirm() returns a PROMISE, which is TRUTHY, so the guard meant to stop a destructive action does nothing and the delete happens anyway. B1 is the case this file exists for. \u26a0 Dismissal must resolve as NO \u2014 native <dialog> closes on Escape whether you planned for it or not, and a dismissed destructive confirmation that resolved TRUE is the worst bug this pattern can have. \u26a0 Focus goes to the SAFE choice, so a teacher pressing Enter out of habit does not delete a session by reflex. \u26a0 Information gets a BANNER, not a modal \u2014 14 of the 22 only reported something \u2014 and row-scoped messages land beside their row, because a banner at the top of a forty-student report about a run 800px down is a message alert() at least did not make you hunt for'],
    ['dialogs-admin-test.mjs',   '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 39, admin.js\u2019s HALF (Round 80, Imperial) \u2014 all 45 sites (30 alert() + 15 confirm(), recounted fresh) converted, one deliberate prompt() left native and pinned to the delete-book handler by name, every ttbConfirm()/ttbChoose() awaited, and the trap reports.html never had to solve: two full-viewport z-index:200 custom modals that would hide a plain-div banner behind their own backdrop \u2014 D1/D2 are the regression test for the wizard-local host that fix needed in BOTH its static and openSplitUI()-rebuilt forms'],
    ['build-list-test.mjs',      '\u26a0\ufe0f ROADMAP 51, 56b, 56c and the staged-work guard \u2014 four rules that are easy to restate where they do not belong. \u26a0\u26a0 THE BUILD LIST SORTS ITS OUTPUT AND NEVER `SOURCES`: that array is mirrored in tools/audit-versions.mjs and version-stamp-test.mjs \u00a7D, half its entries carry positional comments, and it is the only record of registration order \u2014 A3 catches a later round tidying the array instead. \u26a0\u26a0 PARSE & INITIALIZE asks before discarding staged chapters, names the FILE it will read (v3.25.2: the input survives everything), and asks ONLY when there is something to lose. \u26a0\u26a0 NO BUTTON BUILT IN JS SETS `background` INLINE \u2014 an inline value beats every selector, so `button:hover` cannot reach it; scoped by what createElement() was asked for, since a <div> has no hover to lose. \u26a0 AND ONE ELEMENT, ONE `class` ATTRIBUTE: the class manager\u2019s Delete carried two, HTML discarded the second, and its hover and its selector hook went with it. \u26a0\u26a0 PART F IS ROADMAP 55a: the metadata panel is ONE SIX-COLUMN GRID, and every row\u2019s spans must sum to exactly six \u2014 it was seven equal flex columns sharing what the 120px cover left over, and both URL fields rendered as the string `https:/`, useless. Asserts STRUCTURE, never pixels (a width assertion in an item about widths goes red for reasons that are not defects), that no field is a FRACTION of a neighbour, that min-width:0 survives, and that tools/meta-panel-ab.html still carries the SHIPPED markup \u2014 a stale A/B is a picture of a page that does not exist'],
    ['control-tier-test.mjs',    '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 38 \u2014 A CONTROL THAT REACHES STUDENTS MUST NOT LOOK LIKE ONE THAT OPENS A TEXT BOX. `#upload-all-btn` carried NO class at all and fell through to admin.html\u2019s default `button { background:#0047AB }`, the EDIT blue \u2014 so the control that pushes a book to every student in the building was visually identical to the one that opens a text box, and it is the largest target on the panel. Asserts the TIER, never the shade (the shade is item 38\u2019s next pass and would go red for a reason that is not a defect), that .tier-commit and the legacy .danger-btn share ONE declaration so the two reds cannot drift apart, and that commit never resolves to the default background. \u26a0\ufe0f Reads admin.js too \u2014 most of this page\u2019s controls are built in template strings, and a check that only read the markup would call a half-tiered page tiered'],
    ['mirror-heal-test.mjs',     '\u26a0\ufe0f\u26a0\ufe0f ROADMAP 50 \u2014 A SURFACE THAT READS A WEEK MUST HEAL THE MIRROR. Round 58 wired logdays.js\u2019s reconcile() into learn.js alone; game.js and index.html paint the same weekly figure off the same per-browser ledger and never healed it, so a student who spent the day in Library kept a mirror missing days the server vouches for \u2014 and planReads() turns a missing day into a skip and a skip into a zero. \u26a0\u26a0 PART A DISCOVERS the surfaces from real readWeek() call sites rather than naming today\u2019s three, because a FOURTH surface arriving unhealed is the defect. \u26a0\ufe0f PART B is why it is free: reconcile() must be handed a document the enclosing function already read, found by brace-matching, not a fresh getDoc() smuggled into the argument list. \u26a0\ufe0f logdays-test.mjs drives the same functions and never asked whether anything CALLS them'],
    ['logdays-test.mjs',         '\u26a0\ufe0f THE LEDGER MAY OVER-READ AND MUST NEVER UNDER-READ: no ledger and a malformed one both mean READ EVERYTHING (never "typed on no days"), dates before `since` are always swept, the two copies UNION rather than override, one student never inherits another\u2019s mirror, and 2000 random ledgers never skip a day the student really typed. \u26a0\ufe0f SECTION G IS ITEM 18: a PRUNED readWeek() returns the IDENTICAL week total to an unpruned one, a skipped day must NOT set ok:false (an ordinary Monday would suppress every HUD), today is always fetched, and a read that throws still sets ok:false'],
    ['lesson-gate-test.mjs',     '\u2b50 ROADMAP 10 \u2014 THE LESSON-FARMING GATE. \u26a0\ufe0f Section A is the one that matters: an UNMASTERED lesson is NEVER gated, at any distance, forever \u2014 if it goes red the feature has inverted and is punishing the struggling student. Also: the legacy fireCount seed is 1 and not 3, progress RESETS the reach-back window, re-firing re-locks immediately, and BOTH page controllers count active days'],

    // ⚠️ Round 24 (Monotype). THE EVENING GUEST. sessionLogAdopt() recomputed a
    // record's date from `at.slice(0, 10)` — UTC — throwing away the local date
    // the caller had already stamped. In Central time that is tomorrow from
    // 7:00 PM, so an evening guest's clock landed on today and their sprint
    // record on tomorrow. Invisible during school hours, which is why every
    // classroom test of the guest handover passed on a build with it.
    // 4 failing against session-log.js v1.5.0.
    ['adopt-date-test.mjs',      'THE EVENING GUEST: an adopted sprint keeps the local date the student typed it on, not the UTC one'],

    // ⚠️ Round 24 (Monotype). THE OVERNIGHT RESCUE, on Jake's ruling: a child
    // who typed as a guest and did not sign in until the next day keeps those
    // minutes, credited TO THE DAY THEY TYPED THEM. Every Part is a different
    // wrong day — today (the double-credit), the future (a bad device clock),
    // and a pre-cutover day (which is §3.1 with an addition in front of it).
    ['carryover-test.mjs',       'THE OVERNIGHT RESCUE: yesterday\u2019s guest minutes reach yesterday\u2019s document, and never today\u2019s'],

    // ⚠️ Round 24 (Monotype). ROADMAP item 6, CONFIRMED AND FIXED for Library.
    // A sprint crossing midnight was split correctly by the day counters and
    // filed WHOLE by the session record, under the day it ended on — the
    // observed 4m 9s rollup beside a 0m 6s daily log. Part D asserts the
    // remaining School gap ON PURPOSE; invert it when learn.js is done.
    ['midnight-test.mjs',        'A SPRINT THAT CROSSES MIDNIGHT belongs to two days, and the record must say so'],
];

// ⚠️ RULES — need the Firebase emulator (a JVM plus a jar download), so they are
// NOT part of `npm test`; a fresh clone cannot be assumed to have java. Run them
// with `npm run test:rules`. They are named here so the registration audit can
// see them and so that NOBODY CONCLUDES AGAIN THAT THE RULES CANNOT BE TESTED —
// firestore-rules.test.mjs carried an "I COULD NOT RUN THIS" header for four
// rounds and it was false the whole time. Round 20 then designed a fix the
// deployed rules reject. See tests/README.md → "Running the rules harnesses".
const RULES = [
    ['rules-probe.test.mjs',     'the rules questions HANDOFF \u00a70.-5 depends on: the roster sweep, the per-source shape, the owner read, and \u26a0\ufe0f Part D \u2014 a day the student never typed reads as MISSING, not DENIED (the v2.6.0 incident)'],
    ['firestore-rules.test.mjs', 'the broad security suite \u2014 staff scoping, student isolation, privilege escalation'],
];

// ⚠️ PENDING — written test-first, against app code that has NOT landed. Each
// entry names the exact blocker. These run, and their failures are reported, but
// they do not count as suite failures. When one starts passing the runner says so
// in capitals: move it into FAST and delete it from here, same commit.
// ✅ EMPTY, and that is the correct resting state. The three harnesses that opened
// this list (open-unit, session-merge, source-split) were promoted into FAST the
// moment their app code landed, which is the rule below working as intended.
const PENDING = [
];

// Slow: need a directory of EPUBs. Default to the repo's library/, which each
// harness now resolves as ../library relative to itself.
const EPUB = [
    ['chapter-harness.mjs',   'full chapter pipeline over the corpus'],
    ['real-epub-harness.mjs', 'cover detection + spine resolution'],
    ['scan2.mjs',             'suspect body chapters (Fix C candidates)'],
    ['fix-candidates.mjs',    'BEFORE/AFTER differ — collateral damage from importer changes'],
];

// ⚠️ SYNTAX GATE. `node --check foo.js` parses a .js file as a SCRIPT, not a module,
// and so accepts an ES module with an unclosed method — it did exactly that during
// Round 6, and only an actual `import` surfaced it. Every shipped .js here is an ES
// module, so they must be checked as modules. Cheap, and it fails loudly.
import { readFileSync as _rf } from 'node:fs';
// ⚠️ THE THREE SHARED MODULES WERE MISSING FROM THIS LIST — stats-wal.js since
// Round 11, session-log.js since Round 12 — so the files game.js and learn.js both
// depend on were the only shipped JS nothing parsed. Found in Round 13 when hud.js
// became the fourth. A shared module is the worst possible thing to leave
// unchecked: a syntax error in one takes down BOTH student pages at import time.
// ⚠️ THREE WERE MISSING UNTIL ROUND 25 AND TWO OF THEM ARE LOAD-BEARING ON A
// STUDENT PAGE. `update-gate.js` is imported by game.html AND learn.html;
// `daylog.js` is imported by game.js AND learn.js. Both are exactly the case the
// paragraph above describes as the worst thing to leave unchecked, and both had
// been left unchecked. daylog.js was accidentally covered — several harnesses
// import it, so a syntax error would have surfaced somewhere — but update-gate.js
// was covered by nothing at all: a stray character in it would have taken down
// both student pages at import time and this suite would have reported success.
// ⚠️ ADD EVERY NEW SHIPPED MODULE HERE. It is a hand-maintained list, which is
// why it drifted; there is no import graph to walk without a bundler.
const MODULES = ['game.js', 'learn.js', 'admin.js', 'adventure-renderer.js',
                 'keyboard.js', 'lessons-admin.js', 'staff-admin.js', 'versions.js',
                 'firebase-config.js', 'stats-wal.js', 'session-log.js', 'hud.js',
                 'variety-floor.js', 'daylog.js', 'update-gate.js', 'rights-ladder.js',
                 'drill-filter.js'];
let syntaxBad = 0;
for (const f of MODULES) {
    const r = spawnSync(process.execPath, ['--input-type=module', '--check'],
                        { input: _rf(ROOT + f, 'utf8'), encoding: 'utf8' });
    if (r.status !== 0) {
        syntaxBad++;
        console.log(`  FAIL ${f.padEnd(26)} does not parse as an ES module`);
        console.log((r.stderr || '').split('\n').slice(0, 4).map(l => '         ' + l).join('\n'));
    }
}
if (!syntaxBad) console.log(`  ok   ${'(syntax)'.padEnd(26)} all ${MODULES.length} shipped modules parse as ES modules`);

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRATION AUDIT — the part of v1.4.0 that actually matters
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ AN UNREGISTERED HARNESS IS NOT COVERAGE, AND NOTHING USED TO NOTICE. Three
// harnesses sat in tests/ in no list — including the only one that drives the
// live §3.1 defect — while this file printed ALL 29 HARNESSES PASS.
//
// This reads the directory and fails the suite on anything unaccounted for. To
// exempt a file you must name it AND say why, right here, which is a deliberate
// act that shows up in a diff.
const EXEMPT = new Map([
    ['run-all-tests.mjs', 'this file'],
    ['cover-harness.mjs', 'needs a directory of EPUBs AND writes image files; run by hand'],
    // ⚠️ NOT A HARNESS — it asserts nothing and has no exit code. It is the only
    // real production session data in the repository, lifted out of
    // union-clock-test.mjs before Round 23 deleted it, because Jake's rule 10
    // will not accept synthetic records for a defect that lives BETWEEN records.
    // Imported by harnesses; never run on its own. Deleting it costs the project
    // the only evidence it has about what a real day looks like.
    ['real-sessions-fixture.mjs', 'a data fixture imported by harnesses, not a harness itself'],
]);
const listed = new Set([...FAST, ...PENDING, ...EPUB, ...RULES].map(e => e[0]));
const onDisk = readdirSync(HERE).filter(f => f.endsWith('.mjs'));
const orphans = onDisk.filter(f => !listed.has(f) && !EXEMPT.has(f));
if (orphans.length) {
    console.log('');
    console.log(`  FAIL ${'(registration)'.padEnd(26)} ${orphans.length} harness(es) in tests/ are in NO list:`);
    for (const f of orphans) console.log(`         ${f}`);
    console.log('         Add each to FAST, PENDING, EPUB or RULES — or to EXEMPT with a reason.');
} else {
    console.log(`  ok   ${'(registration)'.padEnd(26)} all ${onDisk.length} files in tests/ are accounted for`);
}

const withEpubs = process.argv.includes('--with-epubs');
const suite = withEpubs ? [...FAST, ...EPUB] : FAST;

let failed = 0, missing = 0, landed = 0;
const results = [];

const run = (file) => {
    const r = spawnSync(process.execPath, [HERE + file], { cwd: ROOT, encoding: 'utf8', timeout: 600000 });
    const out = (r.stdout || '') + (r.stderr || '');
    return { out, bad: r.status !== 0 || /FAIL|UNSAFE|\bERROR\b/.test(out) };
};

for (const [file, what] of suite) {
    if (!existsSync(HERE + file)) { results.push(['MISS', file, what]); missing++; continue; }
    const { out, bad } = run(file);
    if (bad) { failed++; results.push(['FAIL', file, what, out]); }
    else results.push(['ok', file, what]);
}

// Pending harnesses run last and are scored backwards: failing is expected and
// silent-ish, PASSING is the event worth reporting.
for (const [file, blocker] of PENDING) {
    if (!existsSync(HERE + file)) { results.push(['MISS', file, blocker]); missing++; continue; }
    const { bad } = run(file);
    if (bad) results.push(['pend', file, blocker]);
    else { landed++; results.push(['LAND', file, blocker]); }
}

console.log('');
for (const [status, file, what, out] of results) {
    console.log(`  ${status.padEnd(4)} ${file.padEnd(26)} ${what}`);
    if (out) console.log(out.split('\n').filter(Boolean).slice(-12).map(l => '         ' + l).join('\n'));
}

console.log('');
if (failed || missing || syntaxBad || orphans.length) {
    console.log(`${failed} failing, ${missing} missing, of ${suite.length} harnesses; ${syntaxBad} syntax failure(s); ${orphans.length} unregistered.`);
} else {
    // ⚠️ THIS LINE IS ONLY TRUE BECAUSE THE REGISTRATION AUDIT ABOVE PASSED.
    // Before v1.4.0 it was printed while three harnesses sat unrun.
    console.log(`ALL ${suite.length} HARNESSES PASS. (${RULES.length} rules harnesses not run — npm run test:rules.)`);
}
if (PENDING.length) {
    console.log(`${PENDING.length} pending (test-first, blocked on app code) — not counted above.`);
}
if (landed) {
    console.log('');
    console.log(`  ⚠️  ${landed} PENDING HARNESS(ES) NOW PASS. The code they were waiting`);
    console.log('      on has landed. Promote them into FAST and delete them from');
    console.log('      PENDING, in the same commit that ships that code.');
}
if (!withEpubs) console.log('(EPUB corpus harnesses not run — pass --with-epubs.)');
if (failed || missing || syntaxBad || orphans.length) process.exitCode = 1;
