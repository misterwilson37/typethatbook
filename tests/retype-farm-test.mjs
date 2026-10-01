// retype-farm-test.mjs v1.0.0 — Round 150 (Nesmith).
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️⚠️ `h`, BACKSPACE, `h`, BACKSPACE … EARNED TIME. THIS PINS THAT IT EARNS NOTHING.
// ═════════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-10-01: *"a kid just found another way to cheat — if the word is 'he',
// the student can hit the h and then backspace continually to count time."*
//
// Round 131 (backspace-farm-test.mjs) refused Backspace and held keys. The `h` in
// between is a real, single, CORRECT keystroke and passed every check. It paid
// time, counted a character, held 100%, climbed the 🔥 streak (a leaderboard) and
// fed the Library gate a fast, accurate minute. In School it also entered
// `chars`, the GRADED numerator, so the same trick could lift a run's WPM.
//
// ⭐ THIS FILE RUNS THE REAL HANDLERS. handleTyping() is lifted out of game.js and
// handleDrillKey() out of learn.js and learn2.js, and executed against a stubbed
// world (a Proxy scope: every name the handler reads that this file does not
// define is a harmless no-op). The thresholds come from the shipped files.
//
// ⚠️⚠️ RULE 10, SAID OUT LOUD: A REPRODUCTION, NOT A RECORDING. No farmed session
// from a real student was available. Part C replays the exploit through the real
// handler and the real thresholds, which proves the mechanism — not production
// data. The first real h-backspace session Jake catches belongs in this file.
//
// Parts:
//   A — the two rules (isNewGround, isRealKey) as truth tables, all three pages
//   B — the structure that keeps them wired (and the arcade's guards)
//   C — Library: the exploit replayed through the real handleTyping()
//   D — Library: an honest long correction is NOT paused and is paid again after
//   E — School: the exploit through the real handleDrillKey(), learn.js and learn2.js
//   F — script-made keys are refused; a trusted key is not
//   G — ttbGate is admins-only; a signed-out tab inherits the last student's gate

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { trustedKeyDispatcher } from './fixtures/trusted-key.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = f => readFileSync(path.join(ROOT, f), 'utf8');
const game = read('game.js');
const learn = read('learn.js');
const learn2 = read('learn2.js');

let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

function extractFn(src, name) {
    const start = src.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let i = src.indexOf('{', start), depth = 0;
    for (let j = i; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
    }
    return null;
}
const constOf = (src, name) => {
    const m = new RegExp(`const ${name} = (\\d+)`).exec(src);
    return m ? parseInt(m[1], 10) : null;
};
const strip = src => src.replace(/^\s*\/\/.*$/gm, '');

// ── a scope in which a lifted handler can run ───────────────────────────────
// Names in `state` are real variables the handler reads and writes. Anything
// else that is not a JS global resolves to a no-op stub, so DOM painting,
// emitters and celebrations simply do nothing.
const REAL_GLOBALS = new Set(['Date', 'Math', 'JSON', 'Object', 'Array', 'String',
    'Number', 'Boolean', 'parseInt', 'isNaN', 'console', 'undefined', 'Infinity', 'NaN',
    'Symbol', 'Set', 'Map', 'RegExp', 'Error', 'TypeError', 'Promise']);
function runIn(state, fnSources, exportName) {
    const stubEl = new Proxy(function () {}, {
        get: (t, k) => (k === Symbol.toPrimitive ? () => '' : stubEl),
        set: () => true, apply: () => stubEl,
    });
    const scope = new Proxy(state, {
        has: (t, k) => typeof k === 'string' && !REAL_GLOBALS.has(k),
        get: (t, k) => (k in t ? t[k] : (k === Symbol.unscopables ? undefined : stubEl)),
        set: (t, k, v) => { t[k] = v; return true; },
    });
    // eslint-disable-next-line no-new-func
    const factory = new Function('scope', `with (scope) { return (function () {\n${fnSources.join('\n')}\nreturn ${exportName};\n})(); }`);
    return factory(scope);
}

// A clock the handlers read through `Date.now()`. Swapped in for each replay.
let NOW = 1;
const realNow = Date.now;
const withClock = fn => { Date.now = () => NOW; try { return fn(); } finally { Date.now = realNow; } };

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nA — THE TWO RULES, AS TRUTH TABLES, ON ALL THREE PAGES');
for (const [file, src] of [['game.js', game], ['learn.js', learn], ['learn2.js', learn2]]) {
    const ng = extractFn(src, 'isNewGround');
    const rk = extractFn(src, 'isRealKey');
    ok(!!ng && !!rk, `A0 ${file} defines isNewGround() and isRealKey()`);
    if (!ng || !rk) continue;
    const isNewGround = new Function(`${ng}; return isNewGround;`)();
    const isRealKey = new Function(`${rk}; return isRealKey;`)();
    ok(isNewGround(5, -1) === true, `A1 ${file}: no backspace run — new ground`);
    ok(isNewGround(4, 5) === false, `⚠️⚠️ A2 ${file}: below the origin — a re-type, earns nothing`);
    ok(isNewGround(5, 5) === true, `A3 ${file}: AT the origin — the corrected letter itself is new ground`);
    ok(isNewGround(6, 5) === true, `A4 ${file}: past the origin — new ground`);
    ok(isRealKey({ isTrusted: true, key: 'h' }) === true, `A5 ${file}: a trusted key is real`);
    ok(isRealKey({ isTrusted: false, key: 'h' }) === false, `⚠️⚠️ A6 ${file}: a script-made key is refused`);
    ok(isRealKey({ key: 'h' }) === false,
       `⚠️⚠️ A7 ${file}: a plain object (no isTrusted at all) is refused — that is a script too`);
    ok(isRealKey(null) === false, `A8 ${file}: nothing at all is refused`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nB — ⚠️⚠️ THE WIRING');
{
    const code = strip(game);
    const ht = strip(extractFn(game, 'handleTyping') || '');
    ok(/const onNewGround = isNewGround\(currentCharIndex, backspaceOrigin\);/.test(ht),
       'B1 handleTyping() decides onNewGround from the cursor and the origin');
    ok(ht.indexOf('const onNewGround') >= 0 && ht.indexOf('const onNewGround') < ht.indexOf('if (key === "Backspace")'),
       '⚠️ B2 …BEFORE the Backspace branch or a correct key moves either of them');
    ok((ht.match(/lastProgressTime = /g) || []).length === 1 &&
       /if \(onNewGround\) \{\s*lastProgressTime = lastInputTime;/.test(ht),
       '⚠️⚠️⚠️ B3 the PAY clock is stamped once, and only on new ground');
    ok(/if \(lastProgressTime && now - lastProgressTime < IDLE_THRESHOLD/.test(code),
       '⚠️⚠️⚠️ B4 gameTick() pays on lastProgressTime');
    ok(/if \(lastInputTime && now - lastInputTime > AFK_THRESHOLD/.test(code),
       '⭐ B5 …and the AFK pause still reads lastInputTime, so a correction never pauses');
    ok(/document\.addEventListener\('keydown', \(e\) => \{\s*if \(!isRealKey\(e\)\) return;/.test(code),
       '⚠️⚠️ B6 game.js: the keyboard listener refuses script-made keys on its first line');
    for (const [file, src] of [['learn.js', learn], ['learn2.js', learn2]]) {
        const h = strip(extractFn(src, 'handleDrillKey') || '');
        ok(/^function handleDrillKey\(e\) \{\s*if \(!isRealKey\(e\)\) return;/.test(h),
           `⚠️⚠️ B7 ${file}: handleDrillKey() refuses script-made keys on its first line`);
        ok(/if \(e\.repeat && e\.key !== 'Backspace'\)/.test(h),
           `⚠️ B8 ${file}: a held key types once (Backspace exempt)`);
        ok(/const wasIdle = learnLastKeyTime > 0/.test(h),
           `⚠️⚠️ B9 ${file}: the idle space skip reads the KEYBOARD clock, not the pay clock`);
        ok(!/learnLastInputTime\s*=\s*Date\.now\(\)/.test(h.slice(h.indexOf('let typed'))),
           `⚠️⚠️⚠️ B10 ${file}: below the hard-stop branch, the pay clock is never stamped unconditionally`);
    }
    for (const f of ['game-deadline.js', 'game-escape.js', 'game-shatter.js']) {
        const k = strip(extractFn(read(f), 'onKeyDown') || '');
        ok(/^function onKeyDown\(e\) \{\s*if \(!e \|\| e\.isTrusted !== true\) return;/.test(k),
           `⚠️⚠️ B11 ${f}: onKeyDown() refuses script-made keys on its first line`);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nC — ⚠️⚠️⚠️ LIBRARY: h, BACKSPACE, h, BACKSPACE … THROUGH THE REAL handleTyping()');
const IDLE = constOf(game, 'IDLE_THRESHOLD');
const AFK = constOf(game, 'AFK_THRESHOLD');
ok(IDLE === 2000 && AFK === 5000, `C0 thresholds as analysed (idle ${IDLE}, afk ${AFK})`);

function libraryWorld(text) {
    const st = {
        fullText: text, currentCharIndex: 0, sprintCharStart: 0,
        backspaceOrigin: -1, mistakesAtCurrent: 0, currentLetterStatus: 'clean',
        lastInputTime: 0, lastProgressTime: 0,
        statsData: { charsToday: 0, charsWeek: 0, charsLibrary: 0,
                     mistakesToday: 0, mistakesWeek: 0, mistakesLibrary: 0 },
        anonCharsTyped: 0, mistakes: 0, sprintMistakes: 0, consecutiveMistakes: 0,
        missedCharsMap: {}, SPAM_THRESHOLD: 999, ggAllowMistakes: true, isOvertime: false,
        gateCorrect: 0, streak: 0, wpmSamples: 0,
        timerDisplay: { style: {} },
        gateOnKey(c) { if (c) st.gateCorrect++; },
        gateLocked: () => false,
        updateStreak(c) { st.streak = c ? st.streak + 1 : 0; },
        updateRunningWPM() { st.wpmSamples++; },
        setTimeout: () => 0,
        finishChapter() {}, triggerHardStop() {}, triggerStop() {},
    };
    const fns = ['countsAsActivity', 'isNewGround', 'handleTyping'].map(n => extractFn(game, n));
    st.handleTyping = runIn(st, fns, 'handleTyping');
    return st;
}

// Plays `keys` (one every `gapMs`) and runs gameTick()'s two clock checks every
// 100 ms exactly as game.js does. `payOn` picks which clock the PAY check reads:
// 'lastInputTime' is the rule that shipped before this round.
function replay(st, keys, gapMs, totalMs, payOn) {
    let credited = 0, pausedAt = null, k = 0;
    for (let t = 1; t <= totalMs; t++) {
        NOW = t;
        if (k < keys.length && t >= 1 + k * gapMs) withClock(() => st.handleTyping(keys[k++], { repeat: false }));
        if (t % 100 === 0) {
            if (st.lastInputTime && t - st.lastInputTime > AFK && pausedAt === null) pausedAt = t;
            const pay = st[payOn];
            if (pausedAt === null && pay && t - pay < IDLE) credited += 100;
        }
    }
    return { credited: credited / 1000, pausedAt };
}

{
    // Ten minutes, four keys a second: `h`, then (Backspace, `h`) forever.
    const keys = ['h']; while (keys.length < 2400) keys.push('Backspace', 'h');
    const before = replay(libraryWorld('he said'), keys, 250, 600000, 'lastInputTime');
    const st = libraryWorld('he said');
    const after = replay(st, keys, 250, 600000, 'lastProgressTime');
    ok(before.credited >= 595,
       `⚠️⚠️ C1 THE OLD PAY RULE PAYS FOR IT: ${before.credited}s of 600 — Jake's report, reproduced`);
    ok(after.credited <= IDLE / 1000 + 0.1,
       `⚠️⚠️⚠️ C2 THE NEW RULE PAYS ONE IDLE WINDOW FOR THE FIRST REAL h AND NOTHING ELSE: ${after.credited}s`);
    ok(st.statsData.charsToday === 1 && st.anonCharsTyped === 1,
       `⚠️⚠️⚠️ C3 ONE character counted, not ~1,200 (${st.statsData.charsToday})`);
    ok(st.gateCorrect === 1,
       `⚠️⚠️ C4 the Library gate saw one correct key, not a fast accurate minute (${st.gateCorrect})`);
    ok(st.streak === 1, `⚠️⚠️ C5 the 🔥 streak is 1, not a leaderboard (${st.streak})`);
    ok(st.wpmSamples === 1, `C6 one live-WPM sample (${st.wpmSamples})`);
    ok(st.mistakes === 0, 'C7 and it was never punished as a mistake — it is ignored, not penalised');
    ok(after.pausedAt === null,
       'C8 the farmer is not auto-paused (they ARE pressing keys) — the timer just greys and stops paying');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nD — ⭐ LIBRARY: HONEST CORRECTIONS');
{
    // A typo at the frontier: x for i, Backspace, i. All new ground.
    const st = libraryWorld('he said hi');
    const keys = 'he sa'.split('').concat(['x', 'Backspace'], 'id hi'.split(''));
    const r = replay(st, keys, 250, 12 * 250 + 3000, 'lastProgressTime');
    const old = replay(libraryWorld('he said hi'), keys, 250, 12 * 250 + 3000, 'lastInputTime');
    ok(r.credited === old.credited,
       `⭐⭐ D1 a typo fixed at the frontier is paid EXACTLY as before (${r.credited}s vs ${old.credited}s)`);
    ok(st.statsData.charsToday === 10, `D2 every letter of "he said hi" counted once (${st.statsData.charsToday})`);

    // A long correction: type 20 letters, erase 10, retype them, carry on.
    // ⚠️ TEN, AT 400 ms: Backspace alone has never kept the game awake (Round
    // 131), so twelve slow ones are a 5.2 s silence and pause the game under the
    // OLD rule as much as the new. That is not what this part tests.
    const text = 'the quick brown fox jumps over the lazy dog';
    const k2 = text.slice(0, 20).split('');
    for (let i = 0; i < 10; i++) k2.push('Backspace');
    k2.push(...text.slice(10, 30).split(''));
    const total = k2.length * 400 + 3000;
    const st2 = libraryWorld(text);
    const r2 = replay(st2, k2, 400, total, 'lastProgressTime');
    const o2 = replay(libraryWorld(text), k2, 400, total, 'lastInputTime');
    ok(r2.pausedAt === null && o2.pausedAt === null,
       '⚠️⚠️⚠️ D3 A 10-LETTER RETYPE IS NEVER AUTO-PAUSED — the AFK clock still sees the keys');
    ok(st2.statsData.charsToday === 30,
       `D4 30 letters of progress = 30 characters, not 40 (${st2.statsData.charsToday})`);
    const retypeS = 10 * 0.4;
    ok(r2.credited < o2.credited && o2.credited - r2.credited <= retypeS + 0.05,
       `D5 only the retype went unpaid: ${r2.credited}s now vs ${o2.credited}s before — ` +
       `a difference of ${(o2.credited - r2.credited).toFixed(1)}s, never more than the ${retypeS}s spent retyping`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nE — ⚠️⚠️⚠️ SCHOOL: THE SAME EXPLOIT THROUGH THE REAL handleDrillKey()');
for (const [file, src] of [['learn.js', learn], ['learn2.js', learn2]]) {
    const LIDLE = constOf(src, 'LEARN_IDLE_THRESHOLD');
    const mk = (seq) => {
        const st = {
            drillSequence: seq, drillPos: 0, drillBackspaceOrigin: -1, drillLetterStatus: 'clean',
            drillCharStates: [], drillIsHardStop: false, drillConsecutiveMistakes: 0,
            learnLastInputTime: 0, learnLastKeyTime: 0, LEARN_IDLE_THRESHOLD: LIDLE,
            chars: 0, mistakes: 0, missedChars: {}, ggAllowMistakes: true,
            statsData: { charsToday: 0, charsWeek: 0, charsSchool: 0,
                         mistakesToday: 0, mistakesWeek: 0, mistakesSchool: 0 },
            currentStep: null, currentLesson: null,
            hardStopThresholdFor: () => 999, spamThresholdFor: () => 999,
            finishStep() {},
        };
        const fns = ['isRealKey', 'isNewGround', 'handleDrillKey'].map(n => extractFn(src, n));
        st.handleDrillKey = runIn(st, fns, 'handleDrillKey');
        return st;
    };
    const press = (st, key, extra = {}) => st.handleDrillKey({
        key, isTrusted: true, repeat: false, ctrlKey: false, metaKey: false, altKey: false,
        preventDefault() {}, ...extra });

    // Pay = isDrillIdle() is false, i.e. learnLastInputTime within LEARN_IDLE_THRESHOLD.
    const st = mk('he said'.split(''));
    let paid = 0;
    for (let t = 1; t <= 600000; t++) {
        NOW = t;
        if (t === 1) withClock(() => press(st, 'h'));
        else if ((t - 1) % 250 === 0) withClock(() => press(st, ((t - 1) / 250) % 2 ? 'Backspace' : 'h'));
        if (t % 1000 === 0 && st.drillPos >= 0 && st.learnLastInputTime && t - st.learnLastInputTime <= LIDLE) paid++;
    }
    ok(paid <= Math.ceil(LIDLE / 1000) + 1,
       `⚠️⚠️⚠️ E1 ${file}: ten minutes of h-backspace pays ${paid}s — one idle window, nothing more`);
    ok(st.chars === 1 && st.statsData.charsToday === 1,
       `⚠️⚠️⚠️ E2 ${file}: ONE character in the GRADED count and the day (chars ${st.chars}, day ${st.statsData.charsToday})`);

    // The idle space skip must not fire mid-correction.
    const s2 = mk('ab cd ef'.split(''));
    NOW = 1000;  withClock(() => { press(s2, 'a'); });
    NOW = 1300;  withClock(() => { press(s2, 'b'); });
    NOW = 1600;  withClock(() => { press(s2, ' '); });
    NOW = 1900;  withClock(() => { press(s2, 'c'); });
    NOW = 2200;  withClock(() => { press(s2, 'Backspace'); press(s2, 'Backspace'); press(s2, 'Backspace'); });
    // slow, honest retype: 1.5 s a key, so the PAY clock goes stale while typing
    NOW = 3700;  withClock(() => press(s2, 'b'));
    NOW = 5200;  withClock(() => press(s2, ' '));
    NOW = 6700;  withClock(() => press(s2, 'c'));
    ok(s2.drillPos === 4 && s2.mistakes === 0,
       `⚠️⚠️⚠️ E3 ${file}: a slow retype across a space is NOT auto-skipped into a mistake ` +
       `(pos ${s2.drillPos}, mistakes ${s2.mistakes})`);

    // A held key types once.
    const s3 = mk('ll'.split(''));
    press(s3, 'l'); press(s3, 'l', { repeat: true });
    ok(s3.drillPos === 1, `⚠️ E4 ${file}: holding "l" types one "l", not the double`);

    // A script-made key does nothing.
    const s4 = mk('he'.split(''));
    press(s4, 'h', { isTrusted: false });
    s4.handleDrillKey({ key: 'h', preventDefault() {} });
    ok(s4.drillPos === 0 && s4.chars === 0, `⚠️⚠️ E5 ${file}: script-made keys move nothing`);
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nF — ⚠️⚠️ A REAL BROWSER EVENT: script-made is refused, trusted is not');
{
    const dom = new JSDOM('<!doctype html><body></body>');
    const isRealKey = new Function(`${extractFn(game, 'isRealKey')}; return isRealKey;`)();
    const seen = [];
    dom.window.addEventListener('keydown', e => seen.push(isRealKey(e)), true);
    dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'h', bubbles: true }));
    trustedKeyDispatcher(dom.window)('h');
    ok(seen.length === 2 && seen[0] === false,
       '⚠️⚠️⚠️ F1 a key fired by a script (what a bookmarklet does) is refused');
    ok(seen[1] === true, 'F2 a browser-originated key is accepted — and so the fixture is honest');
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\nG — ⚠️⚠️ THE LESSON-GATE CONSOLE AND THE SIGNED-OUT TAB');
{
    const code = strip(game);
    ok(!/^\s*window\.ttbGate\s*=\s*\{/m.test(code),
       '⚠️⚠️ G1 window.ttbGate is no longer attached for everyone at page load');
    ok(/setGateConsole\(ADMIN_EMAILS\.includes\(user\.email\)\)/.test(code) &&
       /setGateConsole\(false\)/.test(code),
       '⚠️⚠️ G2 it is attached at sign-in for admins only and removed on sign-out');

    const store = {};
    const st = {
        currentUser: null, GATE_KEY: 'ttb_libGate_v1', GATE_OWNER_KEY: 'ttb_libGate_owner_v1',
        localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    };
    const fns = ['gateOwnerRemember', 'gateStorageKey'].map(n => extractFn(game, n));
    ok(fns.every(Boolean), 'G3 game.js defines gateOwnerRemember() and gateStorageKey()');
    const api = runIn(st, fns, '{ gateOwnerRemember, gateStorageKey }');
    ok(api.gateStorageKey() === 'ttb_libGate_v1_guest',
       'G4 a browser nobody has signed into gets the guest gate, exactly as before');
    st.currentUser = { uid: 'kid1', isAnonymous: false };
    api.gateOwnerRemember('kid1');
    ok(api.gateStorageKey() === 'ttb_libGate_v1_kid1', 'G5 a signed-in student gets their own gate');
    st.currentUser = null;
    ok(api.gateStorageKey() === 'ttb_libGate_v1_kid1',
       '⚠️⚠️⚠️ G6 SIGNED OUT, THE SAME BROWSER IS STILL THAT STUDENT\u2019S GATE — the sign-out dodge is closed');
    st.currentUser = { uid: 'anon9', isAnonymous: true };
    ok(api.gateStorageKey() === 'ttb_libGate_v1_kid1', 'G7 an anonymous session on that browser is too');
    ok(/gateOwnerRemember\(user\.uid\)/.test(code), 'G8 sign-in records the owner');
}

console.log(`\n${fails.length ? 'FAIL' : 'PASS'} — ${pass} ok, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
