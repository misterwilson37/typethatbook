// typing-calibrator.js v1.0.0 — MEASURE THE CHILD, EVERY RUN, FROM PLAY ITSELF.
// Round 118 (Underwood). ROADMAP 118a.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ WHY THE DROPDOWN HAD TO GO: GAME WPM AND PROSE WPM ARE DIFFERENT
// QUANTITIES WEARING THE SAME NAME
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-11: *"When I choose 100 (what I type), deadline is impossible —
// even for me."*
//
// He is not slower than he thinks. `peekNext()` in game-shell.js already carries
// his own measurement: **a 100 WPM typist measures 44 in-game; a 30 WPM typist
// measures 22.** Every target costs a locate-and-read before a finger moves, and
// that overhead is roughly constant per word — a rounding error at 20 WPM and
// comparable to the typing itself at 100.
//
// ⭐ SO THE PENALTY GETS WORSE THE BETTER YOU ARE: 30 keeps 73% of its speed,
// 100 keeps 44%. And `spawnIntervalMs()` pushed work at the number the student
// PICKED. Choose 100 and the game demands 2.3× what is physically available on
// that board, under a label reading "how fast the words arrive."
//
// ⚠️ THAT IS THE SAME DEFECT CLASS AS ROADMAP 116g — a control that names a
// promise and means something else. The fix there was to make the control
// honest. The fix here is to stop asking.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⭐⭐ TWO NUMBERS, NOT ONE, AND THEY POINT AT DIFFERENT KNOBS
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake: *"Throw a pane of glass, measure the speed, measure how long it takes
// the student to starting hitting the next piece of glass so you can get both a
// rough speed AND the processing time of the player. You can use that to decide
// how many panes of glass to send and at what speed."*
//
// ⚠️ THE DECOMPOSITION IS THE WHOLE VALUE, because the two numbers disagree
// about the same knob:
//
//   • BURST SPEED — first key to last key, divided by characters. What a pane
//     can carry as a deadline. Sets HOW FAST.
//   • ACQUISITION — spawn to first correct key. Finding it, reading it, aiming.
//     Sets HOW MANY.
//
// ⭐⭐ AND MORE PANES MOVE THEM IN OPPOSITE DIRECTIONS DEPENDING ON WHO IS
// PLAYING. For a fast typist more panes LOWER acquisition — they read ahead, and
// having only one word on screen is exactly what dropped Jake from 100 to 44.
// For a struggling child more panes RAISE it: now they are hunting through
// clutter. ⚠️ THAT IS PRECISELY WHY `MIN_ON_SCREEN = 3` COLLAPSED THE CORPUS
// SWEEP FROM 99.9% TO 53.2% AS A GLOBAL CONSTANT and is right per-student.
// Measuring acquisition is how we find out which side of that line a child is
// on, and nothing in this app has ever asked.
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ WHAT THIS MODULE DELIBERATELY DOES NOT DO
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ IT NEVER PRODUCES A NUMBER FOR A HUD, A RESULT CARD OR A REPORT. RULE 11.
// The calibration WPM is not `netWPM()` — different window (a burst, not a
// session), different denominator (characters of target text, not keystrokes),
// different purpose. If it ever reached a screen there would be two numbers
// called WPM that disagree, and this project has paid for that twice.
// ⭐ THE STUDENT SEES A DIFFICULTY, NEVER A SPEED.
//
// ⚠️ IT STORES NOTHING. Jake: *"I would lean toward getting the math every time
// — that way the game is always the same."* No Firestore read per launch, no
// stale record, nothing to go wrong for a guest or in incognito, and no Rule 9
// conversation about a second place a student's speed lives. ⭐ IT IS RULE 10 BY
// CONSTRUCTION: the number is derived fresh from real play, every time.

export const TYPING_CALIBRATOR_VERSION = '1.0.0';

// ⚠️ HOW MANY CLEAN SAMPLES BEFORE THE ESTIMATE IS TRUSTED. Below this the
// caller must use the floor. ⭐ FOUR IS A COMPROMISE AND IT IS THE FIRST NUMBER
// TO CHALLENGE WITH A ROTATION: fewer and one fluke sets the run, more and the
// calibration phase outlasts a child's patience.
export const MIN_SAMPLES = 4;

// ⚠️⚠️ ANY GAP LONGER THAN THIS IS NOT TYPING. Jake's classroom, not a lab: a
// child who looks out of the window, answers a question, or drops a stylus
// records a five-second acquisition. ⭐ ONE DISTRACTION MUST NOT SET THE
// DIFFICULTY FOR A WHOLE RUN, and this is the failure most likely to actually
// bite in a rotation of thirty.
export const ACQUIRE_CAP_MS = 4000;

// ⚠️ AND THE SAME FOR A PAUSE MID-WORD. A burst with a two-second hole in it is
// two bursts, and averaging across the hole understates a child who types in
// confident chunks — which is most beginners.
export const BURST_GAP_CAP_MS = 1500;

// ⚠️ FLOOR AND CEILING ON WHAT WE WILL BELIEVE, IN GAME WPM. Not a difficulty
// setting — a sanity clamp on arithmetic that divides by a measured interval.
export const MIN_BELIEVABLE_WPM = 5;
export const MAX_BELIEVABLE_WPM = 90;

/**
 * ⚠️ THE GENTLEST PLAYABLE GAME, and it is the answer for a child who froze.
 *
 * Jake, asked what happens to a student who types almost nothing during
 * calibration: *"I would go with gentlest possible."*
 *
 * ⭐ NOT THE LESSON GATE. A child who produced nothing in thirty seconds is
 * telling you something, and answering them with a number derived from the
 * furthest lesson they have passed is answering a different question.
 */
export const FLOOR_WPM = 8;

/** Difficulty dial. ⚠️ APPLIED TO THE TIME BUDGET — see `budgetScale()`. */
export const DIFFICULTY = { easy: 1.2, medium: 1.0, hard: 0.8 };

/**
 * ⚠️⚠️ THE MULTIPLIER SCALES **TIME**, NOT DEMAND, AND THAT IS NOT A DETAIL.
 *
 * Jake: *"the only choice they get is easy/medium/hard, where it's .8 of
 * whatever numbers the math gives you vs 1 vs 1.2."*
 *
 * ⭐ APPLIED TO "DEMAND" IT WOULD HAVE TO DECIDE WHETHER DEMAND MEANS SPEED, OR
 * PANE COUNT, OR BOTH — and if both it compounds silently to ±44%, so "easy"
 * and "hard" would be nearly twice as far apart as the label suggests. Time is
 * one monotone quantity: easy gives you 1.2× as long, hard gives you 0.8×, and a
 * child can predict what the button does before pressing it.
 *
 * ⚠️ IT IS A PREFERENCE ON TOP OF A MEASUREMENT, NOT AN OVERRIDE OF ONE. That
 * distinction is what Jake's 100 WPM setting proved we must not offer again.
 */
export function budgetScale(level) {
    return DIFFICULTY[level] || DIFFICULTY.medium;
}

/**
 * ⚠️ MEDIAN, NOT MEAN. Both the cap above and this are aimed at the same enemy:
 * one bad sample. The cap handles a distraction long enough to spot; the median
 * handles the rest, including a word the child simply could not read.
 */
export function median(xs) {
    if (!xs || !xs.length) return null;
    const a = xs.slice().sort((p, q) => p - q);
    const m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/**
 * Watches play and answers two questions about the child in front of it.
 *
 * ⚠️ PURE AND CLOCK-FREE: every method takes `nowMs`. A harness can drive a
 * whole run in a loop, which is the only reason any of this is checkable.
 */
export class TypingCalibrator {
    constructor(o) {
        const c = o || {};
        this.floorWPM = c.floorWPM > 0 ? c.floorWPM : FLOOR_WPM;
        this.minSamples = c.minSamples > 0 ? c.minSamples : MIN_SAMPLES;
        /** @type {object[]} one entry per cleanly-finished target. */
        this.samples = [];
        this._open = new Map();
        // ⚠️⚠️ THE MOMENT COMFORT STRUCK, OR null. See `comfortAt`.
        this.comfortAt = null;
    }

    /** A target appeared. `onScreen` is the board AFTER it was added. */
    spawned(id, chars, nowMs, onScreen) {
        if (id == null) return;
        this._open.set(id, {
            chars: chars > 0 ? chars : 1,
            spawnAt: nowMs, onScreen: onScreen > 0 ? onScreen : 1,
            firstKeyAt: null, lastKeyAt: null, keys: 0, gapped: false,
        });
    }

    /**
     * One correct character landed on `id`.
     *
     * ⚠️ CORRECT KEYS ONLY. A mistyped key is a different measurement — accuracy,
     * which `netWPM()` already owns — and mixing them would make this number
     * fall when a child is fast and sloppy, which is not what "how fast can they
     * type" means for pacing.
     */
    keyed(id, nowMs) {
        const s = this._open.get(id);
        if (!s) return;
        if (s.firstKeyAt == null) {
            s.firstKeyAt = nowMs;
        } else if (nowMs - s.lastKeyAt > BURST_GAP_CAP_MS) {
            // ⚠️ A HOLE IN THE MIDDLE OF A WORD INVALIDATES THE BURST, it does not
            // merely widen it. Averaging across a pause understates a child who
            // types in confident chunks — which is most beginners, and exactly
            // the child we must not under-serve.
            s.gapped = true;
        }
        s.lastKeyAt = nowMs;
        s.keys++;
    }

    /**
     * `id` was finished. ⚠️ ONLY A FULLY-TYPED TARGET IS A SAMPLE — a pane that
     * was hit, or that the student abandoned, measures the board rather than the
     * child.
     */
    finished(id, nowMs) {
        const s = this._open.get(id);
        this._open.delete(id);
        if (!s || s.firstKeyAt == null || s.gapped || s.keys < 2) return;

        const acquire = Math.min(ACQUIRE_CAP_MS, s.firstKeyAt - s.spawnAt);
        const burstMs = Math.max(1, (s.lastKeyAt != null ? s.lastKeyAt : nowMs) - s.firstKeyAt);
        // ⚠️ CHARACTERS OVER FIVE IS THE WORD, the same denominator
        // `spawnIntervalMs()` prices work in. Any other definition here would be
        // a second answer to "what is a word".
        //
        // ⚠️⚠️ `keys - 1`, NOT `keys`, AND THE HARNESS CAUGHT IT. The window runs
        // from the FIRST key to the LAST, which contains `keys - 1` inter-key
        // gaps and not `keys` of them. Counting the whole word across it
        // overstated every child by `n / (n - 1)` — 14% on an eight-letter word,
        // 25% on a five-letter one. ⭐ AND THE ERROR WAS WORSE FOR SHORTER WORDS,
        // i.e. worst for exactly the children on the early lessons, who would
        // have been handed a game paced for a typist 25% faster than they are.
        const wpm = ((s.keys - 1) / 5) / (burstMs / 60000);
        if (!(wpm > 0) || !isFinite(wpm)) return;

        this.samples.push({
            wpm: Math.max(MIN_BELIEVABLE_WPM, Math.min(MAX_BELIEVABLE_WPM, wpm)),
            acquireMs: Math.max(0, acquire),
            onScreen: s.onScreen, at: nowMs,
        });

        // ⭐⭐ COMFORT — JAKE'S OWN INSTRUCTION, AND IT IS WHY CALIBRATION IS NOT
        // A PHASE. *"if you're measuring all along, I would start the ramp when
        // the comfort strikes."* The moment we have enough clean samples to
        // believe a number is the moment the ramp should begin: before it, the
        // game is finding the child; after it, the game is stretching them.
        // ⚠️ SET ONCE AND NEVER CLEARED. A student who has a bad twenty seconds
        // after settling in must not send the game back to the nursery slope.
        if (this.comfortAt == null && this.samples.length >= this.minSamples) {
            this.comfortAt = nowMs;
        }
    }

    /** A pane was abandoned, hit, or the run restarted. */
    dropped(id) { this._open.delete(id); }

    /** ⚠️ True once the estimate may be believed. Before this, use the floor. */
    get confident() { return this.samples.length >= this.minSamples; }

    /** Median burst speed in GAME WPM, or the floor. Never null. */
    get wpm() {
        if (!this.confident) return this.floorWPM;
        const m = median(this.samples.map(s => s.wpm));
        return Math.max(this.floorWPM, m);
    }

    /** Median acquisition in ms, or null while unknown. */
    get acquireMs() {
        if (!this.confident) return null;
        return median(this.samples.map(s => s.acquireMs));
    }

    /**
     * ⚠️⚠️ HOW MANY PANES THIS CHILD SHOULD BE HOLDING — the answer to Jake's
     * *"decide how many panes of glass to send"*, and the only place acquisition
     * is used rather than merely recorded.
     *
     * ⭐ A CHILD WHOSE ACQUISITION IS SHORT IS READING AHEAD, AND READ-AHEAD IS
     * FREE FOR THEM: more panes make them faster. A child whose acquisition is
     * long is hunting, and more panes make the hunt worse. ⚠️ THIS IS THE
     * PER-STUDENT VERSION OF THE `MIN_ON_SCREEN = 3` EXPERIMENT THAT WAS
     * CORRECTLY REJECTED AS A GLOBAL — the sweep that collapsed to 53.2%
     * averaged over every child, including the ones it was hurting.
     *
     * ⚠️ NEVER BELOW 1. Zero panes on screen is not a difficulty, it is a
     * stopped game.
     */
    get onScreenTarget() {
        const a = this.acquireMs;
        if (a == null) return 1;
        if (a <= 600) return 3;
        if (a <= 1200) return 2;
        return 1;
    }

    /** Everything a director needs, in one read. */
    snapshot() {
        return {
            confident: this.confident,
            wpm: this.wpm,
            acquireMs: this.acquireMs,
            onScreenTarget: this.onScreenTarget,
            comfortAt: this.comfortAt,
            samples: this.samples.length,
        };
    }

    /** ⚠️ A RESTART IS A NEW CHILD as far as this is concerned. */
    reset() {
        this.samples = [];
        this._open.clear();
        this.comfortAt = null;
    }
}
