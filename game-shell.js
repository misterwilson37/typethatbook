// game-shell.js v1.9.0 — Round 118 (Underwood): THE DIRECTOR MEASURES THE CHILD.
// ROADMAP 118a. `calibratedWPM` is now the ONE number `intervalMs` and
// `lifetimeFor()` read, and before comfort it is the floor rather than a guess.
// ⚠️ OPT-IN VIA `adaptive` — a host that says nothing is byte-for-byte what it
// was, because a graded lesson's pacing guarantee is a promise about a FIXED
// number and must never move under a student mid-run.
// game-shell.js v1.8.0 — Round 117 (Corona): `arcadeLessonMenu()`, ROADMAP 116g.
// The WORDS control filtered the arcade's word POOL and not the lesson PICKER
// beside it, so a child who chose *from my lessons so far* was still offered
// every lesson in the course. ⭐ THE CAP LIVES HERE, BESIDE arcadeWindow(), for
// the reason that function's header already gives: two windows over one list
// means the arcade draws its letters from one lesson and its menu from another.
// game-shell.js v1.7.0 — Round 104 (Bar-Let): `arcadeWindow()` and `levelIdx`.
// Jake, 2026-09-09: *"choosing a specific level in the lessons should help decide
// what characters are available and what the starting speed should be."* ⭐ AND IT
// COLLAPSED A DUPLICATE THIS FILE HAD ALREADY WARNED ABOUT IN PROSE —
// arcadeKeySet() and arcadeTargetWPM() each spelled the same window arithmetic
// out, under a comment saying two windows would draw the arcade's letters from
// one lesson and its speed from another. A chosen level makes both reachable
// from a picker, so the second copy stops being latent. ⚠️ OMITTING levelIdx IS
// THE OLD BEHAVIOUR EXACTLY.
// game-shell.js v1.6.0 — Round 103 (Bar-Let): `costFactor`, and it exists because
// SHATTER'S TARGETS COST TWICE THEIR OWN CHARACTERS. A student types `unusually`
// to break the rock and then types `un`, `usual` and `ly` — the pieces spell the
// word, so one spawned target is 2N keystrokes, for a two-part word and a
// three-part word alike. ⚠️⚠️ PRICING THAT ROCK AT `unusually`'s INTERVAL WOULD
// DEMAND 30 WPM OF A STUDENT ON A 15 WPM GATE — the same class of defect as the
// MISSION_PRESSURE = 0.75 draft that made every gate unreachable, and it looks
// just as correct. ⭐ `intervalMs`, `lifetimeFor()` and the DEFAULTED quota all
// multiply by it. ⚠️ THE DEFAULT IS 1 AND THAT IS THE OLD BEHAVIOUR EXACTLY:
// Deadline, Escape Key, the lab and every mission are byte-for-byte unchanged.
// game-shell.js v1.5.0 — Round 101 (Wellington): the survival wall is an ABSOLUTE
// 100 WPM (survivalCeilingFor), not a multiple of the lesson's gate — a flat
// multiplier walled two students at 60 and 150 WPM for no visible reason. The
// endless arcade gets the same wall; it had the identical plateau.
// game-shell.js v1.4.0 — Round 101 (Wellington): the pressure ceiling becomes a
// per-run number. ⚠️⚠️ PRESSURE_CEILING IS A PLATEAU — reached 75 targets past the
// quota and then flat — which is exactly *"the student will lose because it gets
// too hard, not because s/he gets tired"* failing. Survival passes
// SURVIVAL_PRESSURE_CEILING; ⚠️ everything that passes nothing is unchanged.
// game-shell.js v1.3.0 — Round 101 (Wellington): `survivalScore`, the one number
// survival mode adds. ⚠️ IT LIVES HERE BECAUSE SCORE MATH LIVES HERE — the view
// that needed it must not compute it, which is this file's founding rule. ⚠️⚠️ AND
// BECAUSE THE ARITHMETIC IS NOT OBVIOUS: end-score minus score-at-the-pass is
// WRONG, since `score` pays for intact shields and survival is when they are
// spent. Everything else survival needs was already here — the pool wraps and
// the pressure ramp already feeds off targets cleared past the quota.
// game-shell.js v1.2.0 — THE GAME TIMING RULE, IN ONE PLACE, WITH NOTHING ELSE
// IN IT. Round 82 (Victor).
//
// ⚠️⚠️ THREE GAMES, ONE COPY OF THE MATH. The arcade views (Deadline, Escape
// Key, and Shatter when it is built) are RENDERERS. They
// own pixels, sprites and feel. They own NO numbers. Every quantity that decides
// whether a child passes — spawn interval, travel time, required WPM, net WPM,
// accuracy, the quota, the pressure ramp, the score — is computed here and only
// here. That is Rule 9, and it is not a style preference: three copies of the
// spawn interval formula is three difficulty curves that drift apart silently
// and are discovered by a twelve-year-old.
//
// ⚠️ PURE. No DOM, no canvas, no Firestore, no requestAnimationFrame, no
// Date.now(), no Math.random() unless you hand it one. Every function that needs
// the clock TAKES `nowMs`. run-grade.js and lesson-gate.js are the model, and it
// is what lets tests/game-shell-test.mjs drive a simulated typist through a whole
// mission without a browser.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ SPEED IS NOT THE KNOB. THROUGHPUT IS.
// ═══════════════════════════════════════════════════════════════════════════
//
// The intuitive design — "make the creatures move at a speed a passing student
// can handle" — tunes the wrong variable, and Gemini's three prototypes all
// tuned it. Pixel velocity decides how long ONE target lives. It does not decide
// how many characters per second the student must produce, and the gate is a
// characters-per-second requirement wearing a WPM costume:
//
//     WPM = (chars / 5) / (seconds / 60)  =  chars per second × 12
//
// So 15 WPM is 1.25 chars/sec and 25 WPM is 2.08 chars/sec, and the thing that
// forces a student to sustain that rate is HOW OFTEN A NEW TARGET ARRIVES.
// Velocity is downstream: it falls out of "how long should a target live",
// which is a readability and catch-up question, not a grading one.
//
// TWO KNOBS, TWO JOBS:
//
//   1. spawnIntervalMs()  sets the PUSH RATE — how fast work arrives whether the
//      student is ready or not. At pressure 1.0 it arrives at exactly gate rate.
//   2. travelMs()         sets the BUFFER. travel = interval × queueDepth means
//      every target gets `queueDepth` intervals to live, so a student who falls
//      momentarily behind can catch up. Pixel speed is then `distance / travel`,
//      computed by the view against its own canvas — which is why a 120 Hz iPad
//      and a 60 Hz Chromebook play the identical game. ⚠️ THE PROTOTYPES WERE
//      ALL px-PER-FRAME AND RAN AT DOUBLE SPEED ON A 120 Hz SCREEN.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ PRESSURE MUST BE 1.0, AND THE SCREEN MUST NEVER BE EMPTY.
// ═══════════════════════════════════════════════════════════════════════════
//
// The first draft of this file set MISSION_PRESSURE to 0.75, reasoning that a
// student at gate speed deserves 25% headroom. ⚠️ IT MADE EVERY GATE UNREACHABLE
// AND IT WOULD HAVE FAILED EVERY CHILD IN THE BUILDING. The arithmetic, which
// tests/game-shell-test.mjs Part A now pins:
//
//     gate 15 WPM, 4-char targets, pressure 0.75  →  interval 4.27 s
//     a student who kills each target THE INSTANT IT SPAWNS types 4 characters
//     every 4.27 s, and the clock is running the whole time, so:
//     best achievable WPM = 4 / 4.27 × 12 = 11.3
//
// Because the clock is wall-clock (see GameClock), waiting for the next spawn is
// charged to the student. A push rate below the gate therefore CAPS the
// achievable WPM below the gate. Headroom cannot come from the spawn rate.
//
// ⭐ SO: the push rate is set at gate rate (pressure 1.0), and headroom comes
// from the two places it can come from without touching the measured number —
// TARGET LIFETIME (a target lives `queueDepth` intervals, so a momentary stall
// is survivable) and SHIELDS (three leaks before the game ends).
//
// ⚠️⚠️ AND THE PUSH INTERVAL IS A **MAXIMUM WAIT, NOT A METRONOME.** If the
// screen has fewer than MIN_ON_SCREEN targets on it, the next one spawns at once.
// Without that, pressure 1.0 caps every student at exactly the gate — a child
// typing 30 WPM would read 15, could never earn an A🔥 (which needs 1.5 × the
// gate), and would be told the game measured them when it had measured the
// spawn timer. On demand, a fast student pulls work continuously and their WPM
// is their own; a slow student still has work pushed at them at gate rate and
// falls behind into leaks. ⚠️ DO NOT MAKE SPAWNING PURELY INTERVAL-BASED. The
// interval protects the slow student from a pile-up; the on-demand floor is what
// makes the number mean anything for everyone else.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE SPACE-BAR FORGIVENESS, AND WHY IT IS DELIBERATE AND ONE-DIRECTIONAL
// ═══════════════════════════════════════════════════════════════════════════
//
// A drill charges the student for the delimiter: typing `asdf jkl;` is ten
// keystrokes, not nine. A game does not — you type the word and the target dies,
// with no space bar. So the SAME TEXT is worth about 18% fewer characters in a
// game than in the drill it came from, which means a game run at a 15 WPM gate
// asks for slightly less physical work than a drill run at the same gate.
//
// ⚠️ CONSIDERED AND REJECTED: requiring a space bar to confirm each kill. It
// makes the two numbers exactly comparable and it is the "correct" answer, and it
// also puts a fiddly extra keystroke between a sixth grader and an explosion.
// Jake's standing preference on the accuracy question (2026-09-07: a leak already
// costs speed, so do not also charge it as an error) points the same way — do not
// add a penalty to make a number tidy.
//
// ⚠️ SO THE ERROR IS ACCEPTED, AND IT IS ACCEPTED IN THE FORGIVING DIRECTION.
// A game is never HARDER than the drill at the same gate. Part E of the harness
// asserts that direction, so a future change that accidentally inverts it fails
// the suite rather than quietly failing children.
//
// ⚠️ WHAT IS **NOT** FORGIVEN: `chars` and `mistakes` are honest keystroke
// counts, and netWPM()/accuracyPct() below are character-for-character the same
// formulas as learn.js's. No phantom characters are credited anywhere. Crediting
// the missing delimiter as a correct character would have inflated ACCURACY too
// (4 typed / 1 wrong reads 75%, but 5 charged / 1 wrong reads 80%), and accuracy
// is the number a lesson is actually gated on.

import { TypingCalibrator, budgetScale } from './typing-calibrator.js';
import { safeGroup } from './drill-filter.js';

export const GAME_SHELL_VERSION = '1.9.0';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

// The WPM definition. Five characters is a "word" everywhere in this app.
export const CHARS_PER_WORD = 5;

// Mission pressure: work is PUSHED at exactly gate rate.
// ⚠️⚠️ DO NOT LOWER THIS BELOW 1.0. See the header block — a push rate under the
// gate caps the achievable WPM under the gate and fails everybody. Headroom is
// QUEUE_DEPTH and shields, not spawn rate.
export const MISSION_PRESSURE = 1.0;

// The screen is never allowed to hold fewer than this many targets. This is what
// lets a fast student pull work faster than it is pushed, so their measured WPM
// is theirs and not the spawn timer's. ⚠️ AT 1, a student who clears everything
// instantly always has exactly one target to work on — continuous work, no
// artificial idle, and no wall of words either.
export const MIN_ON_SCREEN = 1;

// How many spawn intervals a target lives for — the buffer that absorbs a
// student's accumulated deficit.
//
// ⚠️⚠️ 3 WAS TOO TIGHT AND ONLY THE REAL CORPUS SHOWED IT. At pressure 1.0 work
// arrives at exactly gate rate, so a student typing at exactly the gate WITH ANY
// ERROR RATE is fractionally slower than the push and the deficit COMPOUNDS across
// a run. Measured over all 110 authored game-eligible runs, 9 seeds each, with a
// typist at exactly the gate and a realistic 2% error rate:
//
//     QUEUE_DEPTH 3 → 19 failures / 990 trials, 6 runs affected
//     QUEUE_DEPTH 4 →  1 failure  / 990 trials, 1 run affected
//     QUEUE_DEPTH 5 →  0 failures / 990
//
// ⭐ 4, AND THE TWO REASONS IT IS FREE:
//   • ⚠️ PEAK TARGETS ON SCREEN IS **4 AT BOTH 3 AND 4**, because the buffer is
//     measured in TIME and a student who is keeping up never fills it. The
//     readability cost I feared when I wrote "3 is a readability ceiling" does not
//     exist — the depth only matters to a student who is already behind.
//   • ⚠️ IT DOES NOT LET SLOW STUDENTS THROUGH, which is the thing that would
//     actually matter. A typist at 60% of gate speed failed **550 of 550** trials
//     at depth 3, 4 AND 5. The gate still discriminates; the buffer only stops
//     punishing someone for a rounding error.
//
// ⚠️ HEADROOM COMES FROM HERE AND FROM SHIELDS, NEVER FROM THE SPAWN RATE. See
// the header block: a push rate below the gate caps achievable WPM below the gate.
// If missions feel too hard, this is the number to raise — not MISSION_PRESSURE.
export const QUEUE_DEPTH = 4;

// Past the quota, pressure climbs by this much per cleared target. At 0.02 a
// student who clears 25 extra targets is at pressure 1.25 — noticeably harder
// than the mission, reachable by a good sixth grader, and not a cliff.
export const RAMP_PER_TARGET = 0.02;

// Ceiling on pressure. 2.5 × a 15 WPM gate is 37.5 WPM of sustained demand,
// which no student in this building will hold; past here the queue depth is what
// keeps tightening.
export const PRESSURE_CEILING = 2.5;

/**
 * ⭐ THE ABSOLUTE CEILING ON SURVIVAL, IN WPM. Jake, 2026-09-09: *"Arcade mode
 * should really only cap out at 100 wpm. It should work up and up and up until
 * it gets there. Arcade games are made to eat quarters, so it can't go on
 * forever."*
 *
 * ⚠️⚠️ A WPM IS THE RIGHT UNIT AND A PRESSURE MULTIPLE WAS THE WRONG ONE. My
 * first version of this was a flat pressure ceiling of 6.0, which is a MULTIPLE
 * of the lesson's own gate — so it meant 60 WPM of demand on a 10 WPM lesson and
 * 150 on a 25 WPM one. Two students on two lessons would have hit walls twice as
 * far apart as each other for no reason a child could see. The wall is a
 * property of human hands, not of which lesson you happen to be on.
 *
 * ⚠️ PRESSURE_CEILING IS STILL THE FLOOR OF THE ANSWER. A lesson gated near or
 * above 40 WPM would otherwise derive a ceiling BELOW the mission ramp's own 2.5
 * and make survival easier than the run before it — so survivalCeilingFor()
 * takes the larger. See it for the arithmetic.
 */
export const SURVIVAL_MAX_WPM = 100;

/**
 * The pressure ceiling that puts a run's demand at SURVIVAL_MAX_WPM.
 *
 * ⚠️ PRESSURE IS A MULTIPLE OF THE RUN'S OWN GATE — that is what
 * spawnIntervalMs() consumes — so an absolute WPM wall has to be divided by the
 * gate to become one. A 10 WPM lesson gets 10.0, a 25 WPM lesson 4.0, and both
 * students hit 100 WPM of demand at the top.
 *
 * ⚠️⚠️ NEVER BELOW PRESSURE_CEILING. Survival must not be gentler than the ramp
 * a mission already has past its quota.
 */
export function survivalCeilingFor(targetWPM) {
    const gate = targetWPM > 0 ? targetWPM : 15;
    return Math.max(PRESSURE_CEILING, SURVIVAL_MAX_WPM / gate);
}

// Queue depth shrinks with pressure, so the late game is short-fused as well as
// fast. Never below this: a target that lives for one spawn interval cannot be
// caught up on at all, and the game stops being about typing.
export const MIN_QUEUE_DEPTH = 1.5;

/**
 * ⚠️ v1.1.0 — THE MINIMUM GAP BETWEEN TWO TARGETS' SCHEDULED ARRIVALS.
 *
 * `nextTarget()` refuses to schedule a target to land before one already in the
 * air (see the block there — Jake's "small words flew in at speed past longer
 * words"). This is the daylight it leaves between them.
 *
 * ⚠️ NOT ZERO, ON PURPOSE. At zero, two targets land in the same frame and the
 * "type the one closest to the ground" rule has no answer — the student sees a
 * tie and the game picks arbitrarily. 350 ms is under half a second, so it never
 * reads as an artificial queue, and it is comfortably more than one frame at any
 * refresh rate this runs on.
 */
export const ORDER_GAP_MS = 350;

// Score. ⚠️ SCORE IS A VIEW OF PRACTICE, NOT A SEPARATE ECONOMY. Ten points per
// correctly typed character means the leaderboard ranks the student who typed the
// most correct characters, which is the thing the app exists to produce. Shield
// bonuses are the only garnish, and they are small enough that they cannot
// outrank real typing.
export const POINTS_PER_CORRECT_CHAR = 10;
export const POINTS_PER_INTACT_SHIELD = 100;

// Arcade mode target size. Home-row nonsense at 4 is what the early lessons
// drill, and it is short enough to read on a moving sprite.
export const ARCADE_GROUP_SIZE = 4;

// ═════════════════════════════════════════════════════════════════════════════
// THE MATH
// ═════════════════════════════════════════════════════════════════════════════

/** Characters per second needed to sustain a given WPM. */
export function charsPerSecondFor(wpm) {
    return (wpm * CHARS_PER_WORD) / 60;
}

/** The WPM a given character count over a given span represents. */
export function wpmFor(chars, seconds) {
    if (!(seconds > 0)) return 0;
    return (chars / CHARS_PER_WORD) / (seconds / 60);
}

/**
 * ⭐ THE PRIMITIVE: how long ONE target takes to type, in ms, at a given gate.
 *
 * A target of `avgTargetChars` characters costs `avgTargetChars / cps` seconds to
 * type at `targetWPM`. Dividing by `pressure` stretches that interval when
 * pressure < 1 (easier) and compresses it when pressure > 1 (harder).
 *
 * ⚠️ `avgTargetChars` IS MEASURED FROM THE ACTUAL WORD LIST, NOT GUESSED. A
 * home-row drill spawns 4-character groups; a Unit 6 sentence lesson spawns words
 * averaging 4.4. Guessing one number for both is a 10% difficulty error in
 * whichever one you guessed wrong, and it lands on the youngest students.
 *
 * ⚠️⚠️ THE TWO GAME FAMILIES ARE THE SAME ARITHMETIC AND THIS IS THE WHOLE
 * REASON THEY CAN SHARE A SHELL:
 *
 *   • A PUSH game (Deadline) asks "how often does a new target arrive?"
 *     → one target per `targetTimeMs`. Fall behind and it reaches the domes.
 *   • A LANE game (Escape Key) asks "how fast does an enemy walk?"
 *     → one cell per `targetTimeMs`, because in Muncher one typed word buys one
 *     cell of movement. A student typing at the gate moves at exactly enemy
 *     speed; faster, they outrun it; slower, it closes.
 *
 * At 4-character groups and a 15 WPM gate that is 3,200 ms either way. ⚠️ THE
 * MUNCHER PROTOTYPE SHIPPED 1,200 ms, which demands 12 × 4 / 1.2 = 40 WPM just to
 * keep pace with an enemy — nearly three times the gate, which is exactly why it
 * felt unfair to a sixth grader and why no amount of iterating on the *rest* of
 * the game fixed it.
 *
 * ⚠️ `spawnIntervalMs` AND `enemyStepMs` ARE ALIASES, NOT COPIES. Two names for
 * one function so each call site reads in its own vocabulary. Do not let either
 * grow a body of its own.
 */
export function targetTimeMs(avgTargetChars, targetWPM, pressure) {
    const cps = charsPerSecondFor(targetWPM);
    if (!(cps > 0) || !(pressure > 0)) return Infinity;
    return (avgTargetChars / cps) * 1000 / pressure;
}
export const spawnIntervalMs = targetTimeMs;   // push games: time between arrivals
export const enemyStepMs = targetTimeMs;       // cadence games: time per enemy step

/** How long a target lives, in ms. The buffer, in units of spawn intervals. */
export function travelMs(intervalMs, queueDepth) {
    return intervalMs * queueDepth;
}

/**
 * Queue depth at a given pressure. Falls from QUEUE_DEPTH toward MIN_QUEUE_DEPTH
 * as pressure rises past 1, so the late game shortens the fuse as well as
 * speeding up the drum.
 */
export function queueDepthFor(pressure) {
    if (pressure <= 1) return QUEUE_DEPTH;
    const span = QUEUE_DEPTH - MIN_QUEUE_DEPTH;
    const t = Math.min(1, (pressure - 1) / (PRESSURE_CEILING - 1));
    return QUEUE_DEPTH - span * t;
}

// ⚠️⚠️ THESE TWO ARE learn.js's netWPM() AND accuracyPct(), CHARACTER FOR
// CHARACTER. If learn.js's ever change, these change in the same deploy or the
// student's game result and the teacher's report describe the same run with two
// different numbers, which is Rule 11.
export function netWPM(chars, mistakes, seconds) {
    if (!(seconds > 0)) return 0;
    const correct = Math.max(0, chars - mistakes);
    return Math.round((correct / CHARS_PER_WORD) / (seconds / 60));
}

export function accuracyPct(chars, mistakes) {
    return chars > 0 ? Math.round(((chars - mistakes) / chars) * 100) : 100;
}

// ═════════════════════════════════════════════════════════════════════════════
// THE WORD SOURCE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Cut a run's character array into targets.
 *
 * ⚠️ THIS IS THE WHOLE REASON THE GAMES NEED NO CONTENT OF THEIR OWN. `run.sequence`
 * is what learn.js baked for this run — already drawn from the lesson's key set,
 * already through drill-filter.js, already the right difficulty. Splitting it on
 * whitespace gives targets that are correct by construction, for every step type,
 * with no second corpus to author or maintain.
 *
 * ⚠️ NEWLINES AND TABS ARE DELIMITERS TOO. `passage` steps carry both, and a
 * target containing a raw newline renders as a box.
 */
export function targetsFromSequence(seq) {
    const text = Array.isArray(seq) ? seq.join('') : String(seq || '');
    return text.split(/\s+/).filter(Boolean);
}

/** Mean target length. The input to spawnIntervalMs(). */
export function avgTargetChars(targets) {
    if (!targets || !targets.length) return 0;
    let n = 0;
    for (const t of targets) n += t.length;
    return n / targets.length;
}

/**
 * The key set an arcade session may draw from: everything the student has
 * unlocked, and nothing they have not.
 *
 * ⚠️ THE UNION, TAKEN UP TO AND INCLUDING THE FURTHEST PASSED LESSON, PLUS THE
 * ONE THEY ARE ON. Jake, 2026-09-07: *"it generates words/letter combos based on
 * as far as they've gotten in the lessons."* A student two lessons into the
 * course meets `asdfjkl;` in the arcade and nothing else — which is the point of
 * the mode, and also the only way the arcade is honest practice rather than a
 * different subject.
 *
 * ⚠️ `lessons` MUST BE IN COURSE ORDER, the same array lesson-gate.js's
 * furthestIndexOf() is given. Sorting is the caller's job because the caller is
 * the one holding the sort the map is already drawn in.
 */
/**
 * ⚠️⚠️ THE ONE ANSWERER FOR "HOW FAR INTO THE COURSE IS THIS ARCADE RUN?"
 *
 * v1.7.0, Round 104. Jake, 2026-09-09: *"choosing a specific level in the lessons
 * should help decide what characters are available and what the starting speed
 * should be."*
 *
 * ⚠️ IT EXISTS AS A FUNCTION BECAUSE arcadeKeySet() AND arcadeTargetWPM() BOTH
 * NEED IT AND MUST NEVER DISAGREE. This file already carried that warning in
 * prose — *"two different windows over the same list would mean the arcade drew
 * letters from one lesson and its speed from another"* — while the arithmetic
 * was spelled out twice, once in each function. A chosen level makes the two
 * copies reachable from a picker, so the second copy stops being a latent bug
 * and becomes a live one. ⭐ SPELLED ONCE NOW.
 *
 * @param {number} [levelIdx]  an index into `lessons`. Omitted or negative means
 *        the old behaviour exactly: the furthest lesson passed, plus the one
 *        they are working on.
 *
 * ⚠️ A CHOSEN LEVEL IS CLAMPED, NOT REJECTED. A stale index from a picker built
 * before a lesson was deleted must give a playable game, not an empty key set.
 */
export function arcadeWindow(lessons, progress, levelIdx) {
    const list = Array.isArray(lessons) ? lessons : [];
    if (!list.length) return -1;
    if (levelIdx != null && levelIdx >= 0) {
        return Math.min(list.length - 1, Math.floor(levelIdx));
    }
    let furthest = -1;
    list.forEach((l, i) => { if (progress && progress[l.id] && progress[l.id].passed) furthest = i; });
    // Include the lesson they are currently working on, not just the last one
    // passed — otherwise a student who has never passed anything gets an empty
    // key set and an arcade with no letters in it.
    return Math.min(list.length - 1, furthest + 1);
}

/**
 * ⚠️⚠️ WHICH LESSONS THE ARCADE'S PICKER MAY OFFER. ROADMAP 116g, Round 117.
 *
 * Jake, 2026-09-11, playing Deadline: *"if a student picks 'What I know so far'
 * in deadline, it still gives him access to literally every lesson. The lesson
 * menu should be locked to exactly what the kid has gotten to. Full pool is
 * available for those kids who haven't done anything."*
 *
 * The WORDS control filtered the POOL and not the PICKER beside it, so a child
 * who chose the honest option was handed Unit 5 anyway. ⭐ THE SETTING WAS
 * LYING, WHICH IS WORSE THAN NOT OFFERING IT — a control that names a promise
 * and does not keep it teaches a student to stop reading the controls.
 *
 * ⚠️⚠️ IT LIVES HERE, NEXT TO arcadeWindow(), AND NOT IN arcade.html. Two
 * reasons, and the first is this file's oldest rule: the window arithmetic is
 * spelled ONCE or the arcade draws its letters from one lesson, its speed from
 * another and its menu from a third. The second is Rule 10 — `arcade.html` is a
 * page and cannot be imported, so a rule that lived there could only ever be
 * checked by grepping its source, and this one is about a student's progress
 * data rather than about a string.
 *
 * @param {object} o
 *   lessons   {object[]} course order, the same array arcadeKeySet() takes
 *   progress  {object}   userProgress
 *   scope     {string}   'level' | 'full' — the WORDS control
 *   playable  {object[]} the page's PLAYABLE entries, each carrying `idx`,
 *                        its index into `lessons`
 * @returns {number[]} positions in `playable` the picker may offer, in order.
 *
 * ⚠️⚠️ IT RETURNS POSITIONS IN `playable`, NOT LESSON INDICES, because that is
 * what the <option> values are subscripted with. `PLAYABLE` drops any lesson
 * with no playable run, so position 6 in the picker is NOT lesson 6 — comparing
 * the cap against the picker's own position would offer work past the window to
 * exactly those students whose course has a gap in it.
 */
export function arcadeLessonMenu({ lessons, progress, scope, playable } = {}) {
    const list = Array.isArray(playable) ? playable : [];
    const all = list.map((_, i) => i);
    if (!list.length) return all;
    // `full` is the student asking for everything. Nothing is withheld.
    if (scope === 'full') return all;

    // ⚠️⚠️ THE EXCEPTION IS LOAD-BEARING AND IT IS NOT THE EMPTY CASE. Jake:
    // *"Full pool is available for those kids who haven't done anything."*
    // ⭐ THE TRAP IS THAT THE OBVIOUS IMPLEMENTATION FAILS THIS QUIETLY RATHER
    // THAN LOUDLY: arcadeWindow() with no progress returns 0, which is a legal,
    // non-empty and entirely wrong menu of ONE — a child's first ever visit to
    // the arcade would offer them "F and J" and nothing else. So the no-history
    // case is answered HERE, before the window is consulted at all.
    let history = false;
    for (const k in (progress || {})) { if (progress[k]) { history = true; break; } }
    if (!history) return all;

    const upTo = arcadeWindow(Array.isArray(lessons) ? lessons : [], progress);
    if (upTo < 0) return all;
    const kept = [];
    list.forEach((p, i) => { if (p && p.idx <= upTo) kept.push(i); });
    // ⚠️ AND THE PICKER IS NEVER EMPTY. A student whose reached lessons all
    // dropped out of PLAYABLE would otherwise get an empty menu beside an
    // enabled Play button, which reads as a dead button. ⭐ SAME RULING AS THE
    // no-history CASE: a child never meets a picker with nothing in it.
    return kept.length ? kept : all;
}

export function arcadeKeySet(lessons, progress, levelIdx) {
    const list = Array.isArray(lessons) ? lessons : [];
    const upTo = arcadeWindow(list, progress, levelIdx);
    const keys = new Set();
    for (let i = 0; i <= upTo; i++) {
        const l = list[i] || {};
        (l.availableKeys || []).forEach(k => keys.add(k));
        (l.newKeys || []).forEach(k => keys.add(k));
    }
    return Array.from(keys);
}

/**
 * Generate arcade targets from a key set.
 *
 * ⚠️ DRAWN THROUGH drill-filter.js's safeGroup(), FOR THE SAME REASON
 * learn.js's generateRandom() is: four independent draws from `asdfjkl;` spells
 * things, it was reported by a student once already, and an arcade the whole
 * school plays on Friday is a bigger sample than a drill.
 *
 * ⚠️ `rand` IS INJECTED so the harness can drive a fixed sequence. Default is
 * Math.random, which is what the browser gets.
 */
export function makeArcadeTargets(keySet, count, groupSize = ARCADE_GROUP_SIZE, rand = Math.random) {
    const keys = (keySet || []).filter(k => typeof k === 'string' && k.length === 1);
    if (!keys.length) return [];
    const out = [];
    for (let i = 0; i < count; i++) {
        const { group } = safeGroup(() => {
            const g = [];
            for (let j = 0; j < groupSize; j++) g.push(keys[Math.floor(rand() * keys.length)]);
            return g;
        });
        out.push(group.join(''));
    }
    return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// THE CLOCK
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ WALL CLOCK, FIRST KEYSTROKE TO END, WITH NO IDLE SUBTRACTION.
//
// learn.js's `stepSeconds` deliberately stops when a student goes idle, because
// in a drill idle time is a child staring at a screen and charging them for it
// would deflate a real WPM. ⚠️ IN A GAME, IDLE TIME IS THE GAME'S OWN DEAD AIR:
// the seconds between spawns when there is nothing on screen to type. An
// idle-aware clock would divide the characters typed by only the seconds spent
// typing them and report 45 WPM for a student producing 15 — an inflated number
// that advances them, lands on the leaderboard, and disagrees with every other
// surface in the app.
//
// ⚠️ THE ONE EXCEPTION IS A HIDDEN TAB, and it is not an exception to the rule so
// much as an admission that the game stopped existing. requestAnimationFrame
// halts when the tab hides, so no spawns happen and no keys arrive; counting that
// wall time would charge a student for a period they were not being asked to do
// anything in. pause()/resume() are for `visibilitychange` and for nothing else.
// ⚠️ DO NOT WIRE THEM TO AN IDLE TIMER.

export class GameClock {
    constructor() {
        this.startedAt = null;   // ms, set by the FIRST keystroke
        this.endedAt = null;
        this.pausedAt = null;
        this.pausedTotal = 0;
    }

    /** Called on the first keystroke. Idempotent. */
    startIfNeeded(nowMs) {
        if (this.startedAt == null) this.startedAt = nowMs;
    }

    pause(nowMs) {
        if (this.startedAt == null || this.endedAt != null || this.pausedAt != null) return;
        this.pausedAt = nowMs;
    }

    resume(nowMs) {
        if (this.pausedAt == null) return;
        this.pausedTotal += Math.max(0, nowMs - this.pausedAt);
        this.pausedAt = null;
    }

    stop(nowMs) {
        if (this.startedAt == null) { this.endedAt = nowMs; return; }
        this.resume(nowMs);
        if (this.endedAt == null) this.endedAt = nowMs;
    }

    /** Graded seconds. Zero until the first keystroke, which is deliberate. */
    seconds(nowMs) {
        if (this.startedAt == null) return 0;
        const end = this.endedAt != null ? this.endedAt : nowMs;
        const paused = this.pausedTotal + (this.pausedAt != null ? Math.max(0, end - this.pausedAt) : 0);
        return Math.max(0, (end - this.startedAt - paused) / 1000);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// THE DIRECTOR
// ═════════════════════════════════════════════════════════════════════════════
//
// What a view asks the director:
//
//     d.keyResult(char, nowMs)      → account a keystroke (view says right/wrong)
//     d.spawnDue(nowMs)             → is it time for a target?
//     d.nextTarget()                → the text for one, and its lifetime in ms
//     d.cleared(target, nowMs)      → student typed it out
//     d.leaked(target, nowMs)       → it got through; shields--
//     d.report(nowMs)               → the numbers, for the modal and the write
//
// What a view NEVER does: compute an interval, a velocity, a WPM, an accuracy or
// a score. It asks. ⚠️ A view that grows its own `speed +=` line is the defect
// this whole file exists to prevent.

export class GameDirector {
    /**
     * @param {object} cfg
     *   targets      {string[]}  the pool, in the order it should be used
     *   targetWPM    {number}    the run's gate, or the student's rolling WPM in arcade
     *   minAccuracy  {number}    the run's gate; the director does not enforce it,
     *                            it reports against it
     *   quotaChars   {number}    characters that constitute "the mission" — for an
     *                            assessed run this is the run's own length, so the
     *                            game is the same size as the run it replaced
     *   shields      {number}    leaks allowed before the game ends
     *   endless      {boolean}   arcade: no quota, ramp from the first target
     *   rand         {function}  injected for the harness
     */
    constructor(cfg) {
        const c = cfg || {};
        this.targets = (c.targets || []).slice();
        this.targetWPM = c.targetWPM > 0 ? c.targetWPM : 15;
        this.minAccuracy = c.minAccuracy == null ? 85 : c.minAccuracy;
        this.shields = c.shields == null ? 3 : c.shields;
        this.shieldsMax = this.shields;
        this.endless = !!c.endless;
        // ⚠️ OPTIONAL, AND THE DEFAULT IS THE OLD BEHAVIOUR EXACTLY. A host that
        // says nothing gets PRESSURE_CEILING, so missions, the lab and Escape Key
        // are byte-for-byte what they were.
        this.pressureCeiling = c.pressureCeiling > 0 ? c.pressureCeiling : PRESSURE_CEILING;
        // ⚠️⚠️ KEYSTROKES THE STUDENT MUST TYPE PER CHARACTER OF TARGET TEXT.
        // 1 for Deadline and Escape Key — you type the word, the target dies.
        // 2 for Shatter, where the word breaks into pieces that spell the word
        // and must be typed again. ⚠️ IT IS A PACING INPUT AND NOTHING ELSE: it
        // does not touch `chars`, `mistakes`, netWPM() or accuracyPct(), which
        // stay honest keystroke counts. See the v1.6.0 note at the top.
        // ⚠️ DEFAULT 1 = THE OLD BEHAVIOUR EXACTLY, like pressureCeiling above.
        this.costFactor = c.costFactor > 0 ? c.costFactor : 1;
        this.rand = c.rand || Math.random;

        this.avgChars = avgTargetChars(this.targets) || ARCADE_GROUP_SIZE;
        // ⚠️⚠️ THE DEFAULTED QUOTA IS IN KEYSTROKES, SO IT SCALES WITH THE COST
        // TOO. `cleared()` is called once per rock — parent AND piece — so a
        // Shatter mission whose quota were the raw target sum would end at half
        // its intended length, and "the game is the same size as the run it
        // replaced" would quietly stop being true. ⚠️ AN EXPLICIT `quotaChars`
        // FROM THE CALLER IS TAKEN AS GIVEN: a host that states a number has
        // already decided what it means.
        this.quotaChars = this.endless ? Infinity
            : (c.quotaChars > 0 ? c.quotaChars
               : this.targets.reduce((n, t) => n + t.length, 0) * this.costFactor);

        // ═══════════════════════════════════════════════════════════════════
        // ⚠️⚠️ THE CALIBRATOR — v1.9.0, Round 118 (Underwood). ROADMAP 118a.
        // ═══════════════════════════════════════════════════════════════════
        //
        // Jake: *"When I choose 100 (what I type), deadline is impossible — even
        // for me… What engine could we build that would gauge where students are
        // and then adjust the game appropriately?"*
        //
        // ⭐⭐ IT REPLACES `arcadeTargetWPM()`'s FURTHEST-LESSON-GATE HEURISTIC
        // RATHER THAN SITTING BESIDE IT. Rule 9: two answers to "how fast is this
        // child" is the defect, not the feature. The gate number survives ONLY as
        // the pre-comfort seed, and `calibratedWPM` is the single reader.
        //
        // ⚠️ OPT-IN. A host that passes nothing gets `targetWPM` exactly as
        // before, so missions, the lab and every graded path are byte-for-byte
        // what they were. **The calibrator must never touch a graded run** — a
        // lesson's pacing guarantee is a promise about a fixed number.
        this.adaptive = !!c.adaptive;
        this.difficulty = c.difficulty || 'medium';
        this.calibrator = c.calibrator || new TypingCalibrator(
            { floorWPM: c.floorWPM });

        this.clock = new GameClock();
        this.chars = 0;          // keystrokes that were part of a target
        this.mistakes = 0;       // of those, wrong ones
        this.clearedChars = 0;   // characters in fully cleared targets
        this.clearedCount = 0;
        this.hitCount = 0;
        this.over = false;
        this.quotaMet = false;

        this._cursor = 0;        // index into targets, wraps
        this._lastSpawnAt = null;
        this._lastInterval = null;   // ⚠️ SET FROM THE TARGET JUST HANDED OUT
        // ⚠️ v1.1.0 — when the last target handed out is scheduled to land.
        // nextTarget() clamps against this so a short word can never overtake a
        // long one already falling. See the block there.
        this._lastArrivalAt = null;
        this._extraCleared = 0;  // targets cleared past the quota — the ramp input
        // ⚠️⚠️ CHARACTERS CLEARED PAST THE QUOTA, FOR THE SURVIVAL SCORE (Round
        // 101). It lives here and not in the view for the reason at the top of
        // this section: a view that computes a score is the defect this file
        // exists to prevent. ⭐ AND THE OBVIOUS SHORTCUT — end score minus the
        // score at the pass — IS WRONG: `score` includes intact shields, and
        // survival is precisely when a student spends them, so the subtraction
        // goes NEGATIVE for anyone who plays on long enough to lose one. Found
        // by running it: a clean 700 fell to 300 after four minutes of survival.
        this._extraChars = 0;
    }

    // ── pressure and pacing ─────────────────────────────────────────────────

    /**
     * Current pressure. Flat at gate rate through the mission, then climbing.
     *
     * ⚠️ ARCADE RAMPS FROM THE FIRST TARGET, and the first draft of this getter
     * silently did not. It gated the ramp on `quotaMet`, and arcade sets
     * `quotaChars = Infinity`, so `quotaMet` could never become true and the
     * arcade had NO difficulty curve at all — the same defect Gemini's Muncher
     * shipped with (a round counter that incremented, displayed, and changed
     * nothing). `cleared()` decides what feeds the ramp; see the note there.
     */
    get pressure() {
        const ramp = this._extraCleared * RAMP_PER_TARGET;
        return Math.min(this.pressureCeiling, MISSION_PRESSURE + ramp);
    }

    /**
     * ⚠️⚠️ THE ONE NUMBER THE PACING READS. Rule 9: `intervalMs` and
     * `lifetimeFor()` used to read `this.targetWPM` directly, and now BOTH read
     * this — so there is exactly one answer to "how fast is this child".
     *
     * ⭐ BEFORE COMFORT IT IS THE SEED, AFTER COMFORT IT IS THE MEASUREMENT.
     * Jake: *"start the ramp when the comfort strikes."* Calibration is therefore
     * the opening ramp and not a phase the child sits through — the game is
     * finding them before, and stretching them after.
     *
     * ⚠️ THE SEED IS DELIBERATELY THE GENTLER OF THE TWO. An adaptive run opens
     * at the floor rather than at the lesson gate, because a child who is about
     * to be measured should not be punished for the first twenty seconds by a
     * guess. **Non-adaptive hosts are untouched.**
     */
    get calibratedWPM() {
        if (!this.adaptive) return this.targetWPM;
        return this.calibrator.confident
            ? this.calibrator.wpm
            : Math.min(this.targetWPM, this.calibrator.floorWPM);
    }

    /**
     * ⚠️ HOW MANY PANES THIS CHILD SHOULD BE HOLDING. A view passes this to
     * `spawnDue()` in place of MIN_ON_SCREEN's global 1.
     * ⭐ THE PER-STUDENT VERSION OF THE EXPERIMENT THAT FAILED AS A GLOBAL: at 3
     * the corpus sweep collapsed from 99.9% to 53.2%, because it averaged over
     * every child including the ones it was hurting.
     */
    get onScreenTarget() {
        if (!this.adaptive) return MIN_ON_SCREEN;
        return Math.max(MIN_ON_SCREEN, this.calibrator.onScreenTarget);
    }

    /**
     * ⚠️⚠️ THE INTERVAL IS SET BY THE TARGET JUST HANDED OUT, NOT BY THE CHUNK
     * MEAN. This was a real bug, found by Rule 10 against the authored corpus and
     * by nothing else:
     *
     *   u4_l1/s4 chunk 0 — `quite quiet quest queen ... pile pine`
     *     lengths 4–5, sd 0.42, mean a good predictor → passes 9 seeds of 9
     *   u4_l1/s4 chunk 1 — `pink pipe pan pay pen ... spear spend speak pride`
     *     lengths 3–6, sd 0.96, and THE LONG WORDS ARE ALL AT THE END
     *     → mean 4.03 sets a 3.23 s interval, but each 6-letter word needs 4.8 s
     *       at a 15 WPM gate, so a gate-speed typist accumulates a deficit
     *       through the back half and loses all three shields.
     *     → failed 9 seeds of 9, DETERMINISTICALLY
     *
     * ⚠️ THE MEAN IS ONLY A CORRECT PACING INPUT IF THE TARGETS ARE UNIFORM, and
     * authored word lists are not — they group by length and by pattern, which is
     * good pedagogy and fatal to a mean. ⭐ WORK MUST ARRIVE AT GATE RATE **IN
     * CHARACTERS**, so a 6-letter word buys 1.5× the interval a 4-letter word
     * does, and a student typing at the gate is never behind regardless of what
     * order the lengths come in.
     *
     * ⚠️ `avgChars` REMAINS THE FALLBACK for the very first spawn, when no target
     * has been handed out yet, and remains the input for cadence games
     * (escape-board.js), where the student chooses which word to type and no
     * single target sets the pace.
     */
    get intervalMs() {
        const chars = this._lastInterval != null ? this._lastInterval : this.avgChars;
        // ⚠️⚠️ THE DIFFICULTY DIAL MULTIPLIES **TIME**, NOT DEMAND — see
        // budgetScale(). Applied to demand it would have to choose between speed
        // and pane count, and hitting both would compound to ±44% behind labels
        // promising ±20%.
        return spawnIntervalMs(chars * this.costFactor, this.calibratedWPM, this.pressure)
            * budgetScale(this.adaptive ? this.difficulty : 'medium');
    }

    /**
     * ⚠️ LIFETIME IS PER-TARGET FOR THE SAME REASON. A 6-letter word that lived
     * for a 4-letter word's travel time is unclearable at the gate no matter how
     * far ahead the student is.
     */
    lifetimeFor(text) {
        const chars = ((text || '').length || this.avgChars) * this.costFactor;
        return travelMs(spawnIntervalMs(chars, this.calibratedWPM, this.pressure),
                        queueDepthFor(this.pressure))
            * budgetScale(this.adaptive ? this.difficulty : 'medium');
    }

    /** Kept for callers that want a representative number for a HUD or a log. */
    get lifetimeMs() {
        return travelMs(this.intervalMs, queueDepthFor(this.pressure));
    }

    /**
     * Is a spawn due?
     *
     * @param {number} nowMs
     * @param {number} onScreen  how many targets the VIEW currently has alive
     *
     * ⚠️⚠️ TWO REASONS TO SPAWN, AND BOTH ARE LOAD-BEARING (see the header):
     *   • the push interval elapsed — this is what buries a student who is
     *     slower than the gate, and it is the pressure the mission measures;
     *   • the screen has dropped below MIN_ON_SCREEN — this is what lets a
     *     student faster than the gate keep working, so the WPM the game
     *     reports is their speed and not the timer's.
     * Removing the second one caps every student at exactly the gate. Removing
     * the first one means a slow student is never under any pressure at all.
     *
     * ⚠️ THE FIRST TARGET SPAWNS IMMEDIATELY AND THE CLOCK IS NOT RUNNING YET.
     * The clock starts on the first keystroke, so a student who takes eight
     * seconds to read the screen is not charged for them — but the game must
     * still put something on screen for them to read.
     */
    spawnDue(nowMs, onScreen = 0) {
        if (this.over) return false;
        if (onScreen < this.onScreenTarget) return true;
        if (this._lastSpawnAt == null) return true;
        return (nowMs - this._lastSpawnAt) >= this.intervalMs;
    }

    /**
     * Hand out one target. Returns `{ text, lifetimeMs }`.
     *
     * ⚠️ THE POOL WRAPS, IT DOES NOT RUN OUT. A run's sequence is finite and the
     * survival phase is not, so a game that stopped spawning at the end of the
     * pool would end by going quiet — which reads as a bug, not as a victory.
     */
    /**
     * The text of the target that will spawn NEXT, without advancing anything.
     *
     * ⚠️⚠️ THIS EXISTS SO THE STUDENT CAN READ AHEAD WITHOUT THE GAME SPAWNING
     * FASTER, AND THE DIFFERENCE IS THE WHOLE POINT.
     *
     * Jake, 2026-09-08, typing at 80-100 WPM: *"Simply waiting for the next word
     * to appear dropped me to 48."* Modelled and reproduced: with one word on
     * screen a student pays a fresh locate-and-read before every target, and at
     * 100 WPM that overhead is comparable to the typing itself — the model
     * reports 44 for a 100 WPM typist and 22 for a 30 WPM one, matching what he
     * measured and what he predicted for a 30 WPM child.
     *
     * ⚠️ RAISING MIN_ON_SCREEN TO SHOW MORE WAS TRIED AND IS WRONG. At 3 the
     * corpus sweep collapses from 99.9% to 53.2% clearable, because a forced
     * refill floor spawns work a slower typist has not asked for. Reading ahead
     * must not mean receiving faster.
     *
     * ⚠️ SO THIS PEEKS ONLY. No cursor movement, no clock, no spawn. The view
     * prints it; the pacing contract is untouched.
     */
    peekNext() {
        if (!this.targets.length) return null;
        return this.targets[this._cursor % this.targets.length];
    }

    /**
     * How close the next spawn is, 0..1. Read-only; advances nothing.
     *
     * ⚠️ THIS IS FOR THE RADAR'S INBOUND CONTACT AND NOTHING ELSE. Jake:
     * *"they should be fading in before they even show up on the play screen -
     * it's a preview of what's coming for kids who type a little faster than
     * the floor."* A word that simply appears at full strength the instant it
     * spawns is not a preview; one that materialises as its spawn approaches is.
     *
     * ⚠️ IT DOES NOT AFFECT PACING. peekNext() and this are both pure reads —
     * raising MIN_ON_SCREEN to show more was tried and collapsed the corpus
     * sweep from 99.9% to 53.2% clearable. Reading ahead must not mean
     * receiving faster; that rule is why these are queries, not spawns.
     */
    spawnProgress(nowMs) {
        if (this.over) return 0;
        if (this._lastSpawnAt == null) return 1;
        const dt = nowMs - this._lastSpawnAt;
        return Math.max(0, Math.min(1, dt / Math.max(1, this.intervalMs)));
    }

    nextTarget(nowMs) {
        if (!this.targets.length) return null;
        const text = this.targets[this._cursor % this.targets.length];
        this._cursor++;
        this._lastSpawnAt = nowMs;
        // ⚠️ THE NEXT INTERVAL IS PRICED FROM THE WORK JUST ISSUED. See intervalMs.
        this._lastInterval = text.length;

        let lifetimeMs = this.lifetimeFor(text);

        // ⚠️⚠️ ORDER PRESERVATION — v1.1.0, AND IT IS A GAMEPLAY FIX, NOT A
        // TUNING ONE.
        //
        // Jake, 2026-09-08, of a 40 WPM student on book prose: *"The words came
        // too fast to keep up with unless he dropped it to about 15 wpm. I think
        // a lot of that had to do with the number of small words that flew in at
        // speed past longer words that came in more slowly."*
        //
        // He diagnosed it exactly. `lifetimeFor()` prices travel time by the
        // target's own length — correct, and the fix for the u4_l1/s4 defect —
        // but in a FALLING game lifetime IS fall speed. A 3-letter word given a
        // 3-letter word's travel time descends nearly twice as fast as a
        // 6-letter word beside it, catches it, and lands first. So:
        //   • the "type the one closest to the ground" rule keeps re-pointing at
        //     a different word, and the student is punished for having correctly
        //     started on the one that WAS lowest;
        //   • mixed-length prose (book words, exactly what he tested) churns
        //     constantly, while a uniform authored word list looks fine — which
        //     is why 990 fixture trials never caught it. THE HARNESS MEASURED
        //     CLEARABILITY, AND THIS IS LEGIBILITY.
        //
        // ⭐ THE FIX IS TO CLAMP ARRIVAL ORDER, NOT TO FLATTEN LIFETIME. Making
        // every target fall at one speed would reintroduce exactly the defect
        // per-target lifetime exists to prevent: a 6-letter word living a
        // 4-letter word's travel time is unclearable at the gate. Instead a
        // target may never be scheduled to land before one already in the air.
        //
        // ⚠️ THIS ONLY EVER LENGTHENS A LIFETIME, NEVER SHORTENS ONE, so every
        // clearability guarantee the 990-trial sweep established still holds —
        // more time is strictly easier. That one-way property is what makes this
        // safe to land without re-running the corpus, and Part A's arithmetic is
        // untouched: lifetimeFor() still returns exactly what it did.
        if (this._lastArrivalAt != null) {
            const earliest = this._lastArrivalAt + ORDER_GAP_MS;
            if (nowMs + lifetimeMs < earliest) lifetimeMs = earliest - nowMs;
        }
        this._lastArrivalAt = nowMs + lifetimeMs;

        return { text, lifetimeMs };
    }

    // ── accounting ──────────────────────────────────────────────────────────

    /**
     * Account one keystroke against a target.
     *
     * ⚠️ THE VIEW DECIDES `correct`, BECAUSE THE VIEW OWNS THE LOCK. Which target
     * a key belongs to is a game-mechanics question (nearest? lowest? locked?)
     * and differs per game. Whether it counted is this file's business.
     *
     * ⚠️ A KEYSTROKE THAT MATCHES NO TARGET AT ALL IS STILL A MISTAKE. The
     * prototypes all dropped unmatched keys on the floor, which meant a student
     * could mash for a minute at 100% accuracy. `correct: false` covers both a
     * wrong letter in a locked word and a key that hit nothing.
     */
    keyResult(correct, nowMs) {
        if (this.over) return;
        this.clock.startIfNeeded(nowMs);
        this.chars++;
        if (!correct) this.mistakes++;
    }

    /**
     * A target was typed out in full.
     *
     * ⚠️ WHAT FEEDS THE RAMP DIFFERS BY MODE, AND THAT IS THE WHOLE DIFFERENCE
     * BETWEEN THE TWO MODES. An assessed mission is flat at gate rate until the
     * quota is met — the student is being MEASURED, and a curve during the
     * measurement would mean the grade depended on how far in they got. Arcade
     * has nothing to measure, so it ramps from the first target: it is a survival
     * board, and a board with no curve has one score, reached by everyone with
     * patience.
     */
    /**
     * @param {object} [opts]
     *   ramp {boolean}  ⚠️⚠️ WHETHER THIS CLEAR ADVANCES THE DIFFICULTY CURVE.
     *
     * ⚠️⚠️ v1.6.0, AND IT IS THE SECOND HALF OF THE SPLIT PROBLEM. A Shatter
     * target becomes three or four rocks, and every one of them is a `cleared()`
     * — correctly, because each is real typing that must reach `clearedChars`,
     * the quota and the survival score. ⭐ BUT `RAMP_PER_TARGET` IS PRICED PER
     * *TARGET*, so Shatter was ramping THREE TIMES per spawn where Deadline ramps
     * once. Found by simulation, not by reading: a child typing at exactly the
     * gate with 100% accuracy lost all three shields at 79 seconds, because
     * pressure had climbed to 1.72 on their own success. ⚠️ IT IS THE SAME SHAPE
     * AS THE costFactor DEFECT ABOVE — a per-target number applied to a game
     * whose targets multiply — and neither is visible in a code review.
     *
     * ⚠️ A CALLER THAT SAYS NOTHING RAMPS, so Deadline and Escape Key are
     * unchanged. Shatter passes `{ ramp: false }` for pieces only.
     * ⚠️ `_extraChars` IS NOT GATED: the survival score is a count of real
     * keystrokes and a piece is real typing.
     */
    cleared(text, nowMs, opts) {
        if (this.over) return;
        const len = (text || '').length;
        const ramps = !opts || opts.ramp !== false;
        this.clearedChars += len;
        this.clearedCount++;
        if (this.endless || this.quotaMet) {
            if (ramps) this._extraCleared++;
            this._extraChars += len;
        }
        if (!this.quotaMet && this.clearedChars >= this.quotaChars) {
            this.quotaMet = true;
        }
    }

    /**
     * ⭐ THE STUDENT TOOK A HIT. One shield, and the game ends at zero.
     *
     * In a push game that is a target reaching the domes; in a cadence game it is
     * an enemy reaching the player. ⚠️ ONE COUNTER, ONE NAME (`hits`), because
     * the alternative considered was keeping `leaks` for Missile Command and
     * adding `hits` for Muncher — TWO RECORDS OF ONE QUANTITY, which is a Rule 9
     * break in the report object itself. `leaked()` survives as a thin alias so
     * the push-game call site reads in its own vocabulary.
     *
     * ⚠️ THE UNTYPED CHARACTERS OF A LEAKED TARGET ARE **NOT** CHARGED AS
     * MISTAKES. Jake's ruling, 2026-09-07: *"kids can already get 100% accuracy
     * and lose because they don't get the required speed - and THAT's what we're
     * looking at here."* A hit costs a shield and costs the seconds spent not
     * typing, which lands as a speed miss — the exact failure this mode measures.
     * Charging it as an accuracy error too would count one event twice and would
     * punish the careful slow typist in a second currency.
     * ⚠️ DO NOT "FIX" THIS BY ADDING THE REMAINING CHARACTERS TO `mistakes`.
     */
    hit(nowMs) {
        if (this.over) return;
        this.hitCount++;
        this.shields--;
        if (this.shields <= 0) this.end(nowMs);
    }

    /** Push-game vocabulary for the same event. */
    leaked(text, nowMs) { this.hit(nowMs); }

    end(nowMs) {
        if (this.over) return;
        this.over = true;
        this.clock.stop(nowMs);
    }

    pause(nowMs) { this.clock.pause(nowMs); }
    resume(nowMs) { this.clock.resume(nowMs); }

    // ── the numbers ─────────────────────────────────────────────────────────

    /**
     * The result. ⚠️ THIS IS THE ONLY THING THAT MAY BE WRITTEN ANYWHERE, and
     * `wpm`/`acc` are computed by the same two functions learn.js grades with.
     *
     * `passed` here means "met both gates". It does NOT decide advancement —
     * run-grade.js's calculateGrade()/gradeAdvances() do, from these same two
     * numbers, exactly as they do for a typed run. ⚠️ DO NOT ADD A GRADE FIELD
     * TO THIS OBJECT: a second place that turns (wpm, acc) into a letter is the
     * thing run-grade.js exists to prevent.
     */
    report(nowMs) {
        const seconds = this.clock.seconds(nowMs);
        const wpm = netWPM(this.chars, this.mistakes, seconds);
        const acc = accuracyPct(this.chars, this.mistakes);
        return {
            wpm, acc, seconds,
            chars: this.chars,
            mistakes: this.mistakes,
            targetsCleared: this.clearedCount,
            hits: this.hitCount,
            shieldsLeft: Math.max(0, this.shields),
            quotaMet: this.quotaMet,
            targetWPM: this.targetWPM,
            minAccuracy: this.minAccuracy,
            metSpeed: wpm >= this.targetWPM,
            metAccuracy: acc >= this.minAccuracy,
            passed: wpm >= this.targetWPM && acc >= this.minAccuracy && this.quotaMet,
            score: this.score,
            survivalScore: this.survivalScore,
            extraCleared: this._extraCleared,
            endless: this.endless,
        };
    }

    get score() {
        const correct = Math.max(0, this.chars - this.mistakes);
        return correct * POINTS_PER_CORRECT_CHAR
             + Math.max(0, this.shields) * POINTS_PER_INTACT_SHIELD;
    }

    /**
     * ⭐ THE BRAGGING-RIGHTS FIGURE: what the student typed AFTER they had
     * already passed. Jake, 2026-09-09: *"survival mode is there to get on the
     * leaderboard/prove your mettle."*
     *
     * ⚠️⚠️ NO SHIELD COMPONENT, DELIBERATELY. `score` above pays for intact
     * shields, which is right for a mission — but survival ends when the shields
     * are gone, so including them would make this number FALL as a student
     * survived longer, and go negative against the score at the pass. It is
     * characters cleared past the quota, priced the same as every other
     * character in this app.
     * ⚠️ IT ALSO CANNOT DOUBLE-COUNT THE GRADED RUN: `_extraChars` starts at the
     * target AFTER the one that met the quota, because cleared() tests
     * `quotaMet` before flipping it.
     */
    get survivalScore() {
        return this._extraChars * POINTS_PER_CORRECT_CHAR;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// BUILDING A CONFIG
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Assessed mission from a run. The run is the one learn.js was about to give the
 * student; the game replaces it and must be the same size.
 *
 * ⚠️ `gates` COMES FROM run-grade.js's gatesForRun(), NOT FROM A LOCAL READ OF
 * THE LESSON. The caller passes it in for the same reason gatesForRun() takes
 * lessonGates as a parameter rather than reaching for module scope.
 *
 * ⚠️ A DRILL STEP HAS `minWPM: null` — SPEED IS NOT GRADED ON RANDOM LETTER
 * GROUPS. A game with no speed requirement is not a game, so an accuracy-only
 * run falls back to the lesson's own advisory WPM (or 15). ⚠️ THAT MEANS THE
 * GAME APPLIES A SPEED PRESSURE THE TYPED VERSION OF THE SAME RUN DOES NOT, so
 * it must not be offered as a substitute for an accuracy-only run without
 * Jake's sign-off. Missile Command is wired to the FINAL run of a lesson, which
 * is a prose or word step in every authored lesson today.
 */
export function missionConfigFromRun(run, gates, lessonGates) {
    const targets = targetsFromSequence(run && run.sequence);
    const gateWPM = gates && gates.minWPM != null ? gates.minWPM
        : (lessonGates && lessonGates.minWPM != null ? lessonGates.minWPM : 15);
    return {
        targets,
        targetWPM: gateWPM,
        minAccuracy: gates && gates.minAccuracy != null ? gates.minAccuracy : 85,
        quotaChars: targets.reduce((n, t) => n + t.length, 0),
        shields: 3,
        endless: false,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ WHERE THE ARCADE'S TARGET WPM COMES FROM (Jake's ruling, 2026-09-07)
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake: *"For straight practice, target wpm should be the gates that are built
// into the lesson gates. For arcade (which I assume is separate), go with their
// rolling wpm from typethatbook."*
//
// The assessed half is already done — `missionConfigFromRun()` reads the run's
// real gates through run-grade.js's `gatesForRun()`.
//
// ⚠️ THE ARCADE HALF NEEDED A SOURCE, AND **THE APP DOES NOT STORE A ROLLING
// WPM.** Every candidate was checked before writing this:
//   • per-run WPM only lands in `typing_logs` via `logRun()`. Averaging it means
//     a query per arcade session, which is exactly the cost the WAL round drove
//     to near-zero. ⚠️ And it is a read the arcade would pay on every launch.
//   • `bestWPM` exists on the `leaderboard` document, but it is a BEST, not a
//     mean. Targeting a child's personal record makes the arcade start at the
//     hardest minute they have ever had.
//   • ⚠️ COMPUTING AND STORING A NEW ROLLING AVERAGE WOULD BE A FOURTH RECORD OF
//     A QUANTITY THE APP ALREADY KNOWS — a Rule 9 break, and the reason this was
//     handed back as a question rather than guessed at.
//
// ⭐ SO: THE GATE OF THE FURTHEST LESSON THE STUDENT HAS REACHED. It is free —
// `lessons` and `progress` are already in memory on both pages, and
// `arcadeKeySet()` below already walks exactly that list to decide which letters
// the arcade may use. Zero new reads, zero new counters, and it tracks the
// student's progress through the course, which is the "scales with them" property
// Jake asked for.
//
// ⚠️ IT LAGS A FAST STUDENT, AND THAT IS THE KNOWN COST. A quick typist parked on
// Unit 1 gets a 15 WPM arcade until they advance. `bestWPM` is accepted as an
// OPTIONAL argument and blended at 80% when the caller happens to have the
// leaderboard document already read — never fetched for this purpose.
// ⚠️ DO NOT ADD A READ TO SUPPLY IT. If the page does not have it, the gate alone
// is the answer.

// Fraction of a student's personal best used as an arcade floor, when a best is
// available for free. ⚠️ NOT 100%: the arcade should be hard, not the hardest
// minute of their life, and pressure ramps from there anyway.
export const ARCADE_BEST_FRACTION = 0.8;

/**
 * @param {object} o
 *   lessons   {object[]} course order, same array arcadeKeySet() takes
 *   progress  {object}   userProgress
 *   bestWPM   {number}   OPTIONAL, and only if the caller already has it
 * @returns {number} WPM
 */
export function arcadeTargetWPM({ lessons, progress, bestWPM, levelIdx }) {
    const list = Array.isArray(lessons) ? lessons : [];
    // ⚠️ THE SAME WINDOW arcadeKeySet() USES, FROM THE SAME FUNCTION. Two
    // windows over one list would draw the arcade's letters from one lesson and
    // its speed from another — see arcadeWindow()'s header.
    const upTo = arcadeWindow(list, progress, levelIdx);
    let gate = 15;
    for (let i = 0; i <= upTo; i++) {
        const g = (list[i] || {}).gates || {};
        if (g.minWPM != null && g.minWPM > gate) gate = g.minWPM;
    }
    const fromBest = bestWPM > 0 ? Math.round(bestWPM * ARCADE_BEST_FRACTION) : 0;
    return Math.max(gate, fromBest);
}

/**
 * Arcade session. Jake, 2026-09-07: *"It's tricking them into practicing more, so
 * of course it counts."*
 *
 * ⚠️ `targetWPM` MAY BE PASSED EXPLICITLY, but the default is arcadeTargetWPM()
 * above — read its header before substituting anything, especially anything that
 * costs a Firestore read.
 */
export function arcadeConfig({ lessons, progress, bestWPM, targetWPM, levelIdx,
                               count = 200, rand = Math.random }) {
    // ⚠️ ONE `levelIdx`, PASSED TO BOTH. See arcadeWindow().
    const keys = arcadeKeySet(lessons, progress, levelIdx);
    const targets = makeArcadeTargets(keys, count, ARCADE_GROUP_SIZE, rand);
    const gate = targetWPM > 0 ? targetWPM
        : arcadeTargetWPM({ lessons, progress, bestWPM, levelIdx });
    return {
        targets,
        targetWPM: gate,
        minAccuracy: 85,
        shields: 3,
        endless: true,
        // ⭐ *"Arcade games are made to eat quarters, so it can't go on forever."*
        // ⚠️ THE ENDLESS MODE HAD THE SAME PLATEAU SURVIVAL DID — it stopped at
        // PRESSURE_CEILING, which on a 10 WPM key set is 25 WPM of demand held
        // flat forever, so a strong typist simply never lost. Now it climbs to
        // SURVIVAL_MAX_WPM like everything else that ramps.
        pressureCeiling: survivalCeilingFor(gate),
        rand,
    };
}
