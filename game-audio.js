// game-audio.js v1.0.0 — SOUND, SYNTHESISED, AND OFF BY DEFAULT.
// Round 82 (Victor).
//
// ⚠️ NO ASSET FILES AND NO CDN. Every sound here is a few oscillator cycles
// through a gain envelope. That keeps the repo free of binaries Jake would have
// to upload through the GitHub web UI, keeps the games loading instantly on a
// school connection, and means there is nothing to 404.
//
// ⚠️⚠️ MUTED BY DEFAULT, AND THAT IS A CLASSROOM DECISION, NOT A TASTE ONE.
// Thirty iPads all making launch noises in a 44-minute related-arts rotation is
// Jake's problem, not the student's. The preference is remembered per browser, so
// a student who turns it on keeps it and a class that never touches it stays
// silent forever.
//
// ⚠️ THE CONTEXT IS CREATED ON THE FIRST DELIBERATE UNMUTE, NEVER AT IMPORT.
// Browsers refuse to start an AudioContext without a user gesture and log a
// console warning when you try, and creating one per mounted game leaks contexts
// on a page a student visits twenty times in a period.
//
// ⚠️ WHY SOUND IS WORTH HAVING AT ALL, in a typing app: a launch thunk per
// keystroke is rhythm feedback, and rhythm is the thing that separates a student
// who types in bursts from one who types evenly. It is the cheapest teaching
// signal in the whole round.

export const GAME_AUDIO_VERSION = '1.0.0';

const STORAGE_KEY = 'ttb.game.sound';

let ctx = null;
let master = null;
let muted = readMuted();

function readMuted() {
    // ⚠️ DEFAULTS TO MUTED, INCLUDING WHEN STORAGE THROWS. A locked-down MDM
    // browser or private mode should be silent, not noisy.
    try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return v !== 'on';
    } catch (_) {
        return true;
    }
}

function writeMuted(m) {
    try { window.localStorage.setItem(STORAGE_KEY, m ? 'off' : 'on'); } catch (_) { /* fine */ }
}

function ensureCtx() {
    if (muted) return null;
    if (ctx) {
        // ⚠️ A CONTEXT CAN BE SUSPENDED BY THE BROWSER (tab hidden, iOS lock).
        // Resuming is cheap and silent when it is already running.
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {});
        return ctx;
    }
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        // Conservative headroom: these are short blips layered over each other
        // during fast typing, and clipping sounds like a broken speaker.
        master.gain.value = 0.16;
        master.connect(ctx.destination);
        return ctx;
    } catch (_) {
        ctx = null;
        return null;
    }
}

export function isMuted() { return muted; }

/** Toggle or set. Call from a click handler — the first unmute needs the gesture. */
export function setMuted(m) {
    muted = !!m;
    writeMuted(muted);
    if (!muted) ensureCtx();
    if (muted && ctx && ctx.suspend) ctx.suspend().catch(() => {});
    return muted;
}

/**
 * One shaped tone.
 *
 * ⚠️ EVERY CALL IS FIRE-AND-FORGET AND NOTHING IS RETAINED. Nodes disconnect
 * themselves at the end of their envelope; keeping references would pile up
 * garbage during a fast run, which on a student iPad shows up as a stutter in
 * the render loop rather than as an audio problem.
 */
function tone({ freq, dur = 0.08, type = 'square', gain = 1, slideTo = null, delay = 0 }) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    // A tiny attack instead of an instant one: a hard start is a click.
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
}

function noise({ dur = 0.25, gain = 1, delay = 0 }) {
    const c = ensureCtx();
    if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
        // Decaying noise: an explosion, not a hiss.
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = gain;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(c.currentTime + delay);
    src.onended = () => { try { src.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) {} };
}

/**
 * ⚠️ THE KEYSTROKE PITCH VARIES BY FINGER, and that is deliberate teaching
 * rather than decoration: eight fingers, eight pitches, so a student hears the
 * shape of a word as well as seeing it. It also makes a wrong finger audibly
 * wrong before they have read the screen.
 */
export const sfx = {
    launch(fingerIndex = 0) {
        const base = 220 * Math.pow(2, (fingerIndex % 8) / 12);
        tone({ freq: base * 2, slideTo: base * 3.2, dur: 0.07, type: 'square', gain: 0.9 });
    },
    misfire() {
        tone({ freq: 150, slideTo: 70, dur: 0.14, type: 'sawtooth', gain: 0.7 });
    },
    clear() {
        tone({ freq: 660, dur: 0.06, type: 'triangle', gain: 0.8 });
        tone({ freq: 990, dur: 0.09, type: 'triangle', gain: 0.6, delay: 0.05 });
    },
    hit() {
        noise({ dur: 0.4, gain: 1 });
        tone({ freq: 90, slideTo: 40, dur: 0.35, type: 'sine', gain: 1 });
    },
    step() {
        tone({ freq: 130, dur: 0.04, type: 'sine', gain: 0.45 });
    },
    web() {
        tone({ freq: 420, slideTo: 260, dur: 0.18, type: 'sine', gain: 0.55 });
    },
    free() {
        tone({ freq: 330, slideTo: 880, dur: 0.16, type: 'triangle', gain: 0.8 });
    },
    hunter() {
        tone({ freq: 200, slideTo: 320, dur: 0.3, type: 'sawtooth', gain: 0.55 });
    },
    win() {
        [523, 659, 784, 1047].forEach((f, i) =>
            tone({ freq: f, dur: 0.16, type: 'triangle', gain: 0.8, delay: i * 0.1 }));
    },
    lose() {
        [392, 330, 262, 196].forEach((f, i) =>
            tone({ freq: f, dur: 0.22, type: 'square', gain: 0.7, delay: i * 0.13 }));
    },
    countdown(n) {
        tone({ freq: n <= 1 ? 880 : 440, dur: 0.1, type: 'triangle', gain: 0.7 });
    },
};
