// arcade-telemetry.js v1.1.0 — Round 119 (Hammond): records `costFactor`. The
// first real traces came back without it, and an interval you cannot divide by
// the cost factor is an interval you cannot interpret.
// arcade-telemetry.js v1.0.0 — Round 119 (Hammond).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ WHY THIS EXISTS: NOBODY CAN COUNT PANES, INCLUDING JAKE, INCLUDING ME
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-09-11: *"All of the games are showing the same issue — nothing
// nothing a million. Super slow to impossible in the course of about a minute.
// It's exponential."* And then: *"As I'm playing, I can't really count the
// appearances, and I'm not sure my brain could count them on replay either,
// given how quickly it ramps up."*
//
// ⭐ HE IS RIGHT, AND VIDEO WOULD NOT FIX IT. Counting overlapping panes from
// pixels is an estimate made by the least reliable instrument available, and it
// cannot see the numbers that actually decide the question — the spawn interval,
// the pressure, what the director BELIEVED the board looked like. ⚠️⚠️ THE GAME
// ALREADY KNOWS ALL OF IT EXACTLY. Asking a human to re-derive it from a
// screen recording is how Round 117 ended up believing a harness's invented
// pacing for a whole round.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ THE FOUR RULES THIS FILE IS BUILT AROUND
// ═════════════════════════════════════════════════════════════════════════════
//
// 1. ⚠️⚠️ **IT MAY NOT CHANGE WHAT IT MEASURES.** A recorder that costs frame
//    time makes the game stutter, and a stuttering game spawns differently —
//    so the instrument would manufacture the very symptom under investigation.
//    ⭐ SO IT NEVER RUNS INSIDE THE FRAME LOOP. It polls on its own timer at
//    `HZ`, well below frame rate, and does nothing but read and push.
//
// 2. ⚠️⚠️ **IT ADDS NO COUNTERS. RULE 9.** Every field is a READ of a number the
//    game already keeps — `panes.length` is the board's own array, `cleared` is
//    the director's own ramp input. ⭐ A telemetry module that counted spawns
//    itself would be a second record of the spawn count, and the first argument
//    in any disagreement would be "well, which one is right" — which is the
//    whole reason Rule 9 exists.
//
// 3. ⚠️⚠️ **STUDENTS MUST NEVER CARRY IT.** Off unless the URL says
//    `?telemetry=1`. Not a setting, not a preference, nothing anybody can leave
//    switched on by accident — a flag that dies when the tab closes.
//
// 4. ⚠️⚠️ **NO STUDENT-IDENTIFYING DATA, EVER.** No name, no id, no school. The
//    file is a pacing trace and nothing else, and it has to stay safe to email.
//    ⭐ THE WORDS THEMSELVES ARE NOT RECORDED EITHER — only their LENGTHS. The
//    question is how many panes and how fast, and the text would make the file a
//    transcript of what a specific child typed, which is a different artefact
//    with different rules attached to it.
//
// ⚠️ AND IT RECORDS `calibration` BUT THE PAGE MUST NOT RENDER IT — Rule 11.
// This is a file that goes to a teacher for diagnosis, not a number that goes on
// a screen next to netWPM(). See game-shatter.js's debug().

export const ARCADE_TELEMETRY_VERSION = '1.1.0';

/**
 * ⚠️ FOUR SAMPLES A SECOND. Not sixty.
 *
 * The thing being measured is how many panes are on screen over a minute or
 * two; it moves on the scale of seconds, so frame-rate sampling would buy no
 * resolution and cost a hundred times the rows. ⭐ A two-minute run is ~480
 * rows — small enough to open in Sheets, which is where Jake will look at it.
 */
export const HZ = 4;

/**
 * Record a run. Returns a handle; call `stop()` to get the trace.
 *
 * @param {function} read   () => the view's debug() object, or null
 * @param {object}   meta   { game, gate, costFactor, adaptive }
 */
export function record(read, meta) {
    const rows = [];
    const t0 = Date.now();
    let timer = null;

    function sample() {
        // ⚠️ A DESTROYED VIEW IS NOT AN ERROR. arcade.html tears the handle down
        // on every cabinet switch, and a recorder that threw on the way out
        // would lose the run it had just finished recording.
        let d = null;
        try { d = read(); } catch { d = null; }
        if (!d) return;
        const panes = d.panes || [];
        rows.push({
            t: +((Date.now() - t0) / 1000).toFixed(2),
            // ⭐ THE NUMBER THE WHOLE QUESTION IS ABOUT.
            onScreen: panes.length,
            // ⚠️ SPLIT OUT, BECAUSE THEY ARE NOT THE SAME THING. A Shatter board
            // of 3 parents and 9 pieces reads as 12 to a student's eye and as
            // one word's worth of work to the director; collapsing them is how
            // "the sky is full" and "you have three words to type" both look
            // true at once.
            parents: panes.filter(p => !p.piece).length,
            pieces: panes.filter(p => p.piece).length,
            // ⚠️ LENGTHS, NOT WORDS. See rule 4 in the header.
            chars: panes.reduce((n, p) => n + p.text.length, 0),
            halfTyped: panes.filter(p => p.typed > 0 && p.typed < p.text.length).length,
            // ── what the DIRECTOR thinks it is doing, at the same instant ────
            // ⭐ THIS IS THE HALF VIDEO COULD NEVER GIVE US. The interesting
            // failure is a disagreement between the board and the director's
            // model of it, and you cannot see a model on a screen recording.
            costFactor: d.costFactor,
            cleared: d.cleared,
            pressure: d.pressure == null ? null : +d.pressure.toFixed(3),
            intervalMs: d.intervalMs == null ? null : Math.round(d.intervalMs),
            lifetimeMs: d.lifetimeMs == null ? null : Math.round(d.lifetimeMs),
            pacedWPM: d.pacedWPM == null ? null : +d.pacedWPM.toFixed(1),
            shields: d.shields,
            over: !!d.over,
        });
    }

    sample();
    timer = setInterval(sample, Math.round(1000 / HZ));

    return {
        stop() {
            if (timer != null) clearInterval(timer);
            timer = null;
            sample();
            return { meta: Object.assign({ version: ARCADE_TELEMETRY_VERSION, hz: HZ }, meta), rows };
        },
        get rows() { return rows; },
    };
}

/**
 * The trace as CSV.
 *
 * ⚠️ CSV AND NOT JSON, BECAUSE OF WHO OPENS IT. Jake reads this in Sheets and
 * charts a column; a nested object would need a step in between, and a step in
 * between is a step that does not get taken at 10pm.
 */
export function toCSV(trace) {
    const cols = ['t', 'onScreen', 'parents', 'pieces', 'chars', 'halfTyped',
                  'costFactor', 'cleared', 'pressure', 'intervalMs', 'lifetimeMs',
                  'pacedWPM', 'shields', 'over'];
    const head = '# ' + JSON.stringify(trace.meta) + '\n' + cols.join(',');
    const body = trace.rows.map(r => cols.map(c => {
        const v = r[c];
        return v == null ? '' : (typeof v === 'boolean' ? (v ? 1 : 0) : v);
    }).join(','));
    return [head, ...body].join('\n') + '\n';
}

/**
 * Save the trace to the student's machine.
 *
 * ⚠️ A DOWNLOAD, NOT AN UPLOAD. There is no endpoint, no collection, nothing
 * that could turn into a place where traces from thirty children accumulate on
 * a server. ⭐ The file exists on the machine that made it until somebody
 * deliberately sends it, which is the only story this project can defend.
 */
export function download(trace, name) {
    const blob = new Blob([toCSV(trace)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name || `ttb-${trace.meta.game || 'run'}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // ⚠️ REVOKED, OR EVERY RUN LEAKS A BLOB FOR THE LIFE OF THE TAB.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Is recording switched on for this tab? See rule 3. */
export function enabled(search) {
    const s = search == null ? (typeof location === 'undefined' ? '' : location.search) : search;
    return /[?&]telemetry=1\b/.test(s);
}
