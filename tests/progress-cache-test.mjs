// progress-cache-test.mjs v1.0.0 — ⚠️⚠️ THE PROGRESS CACHE IS NEVER WRITTEN BEFORE IT IS READ.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS EXISTS
// ═══════════════════════════════════════════════════════════════════════════
//
// ROADMAP 43. Jake, 2026-09-01: *"A student reported that all his progress was
// lost — not his time, but the lesson progression… I saw his screen — 1.1 was
// all he had available to him."*
//
// `refreshProgressCache()` wrote whatever `userProgress` happened to hold, with
// no check that it had ever been READ. `loadUserProgress()` sets it to `{}` and
// then AWAITS a network round trip — so any flush inside that window (an
// ordinary tab switch fires visibilitychange:hidden) persisted the empty map as
// though it were the student's record.
//
// ⚠️⚠️ AND `{}` PASSED THE CACHE-HIT TEST. `typeof {} === 'object'` is true, so
// the next load accepted the empty map as a complete answer and returned before
// touching Firestore. isUnlocked() reads `userProgress[prev.id]?.passed === true`
// for every lesson; with nothing in the map, `allLessons[0]` is the only lesson
// that unlocks. Eight hours of TTL, re-stamped by every subsequent flush, so it
// renewed itself for as long as the student kept working.
//
// ⚠️ THE SERVER RECORD WAS NEVER TOUCHED, and neither was their time — that
// lives in typing_logs, a different path entirely. That is what made this look
// like a lesson-progression bug rather than a cache bug, and it is why the
// teacher's admin view and the student's screen disagreed.
//
// ⚠️⚠️ THIS HARNESS ASSERTS THE INVARIANT, NOT THE CALL SITES. There are two
// callers of refreshProgressCache() today (exitLessonToMap() and flushStats())
// and guarding either one individually leaves the next one open. The invariant
// is: **the cache is written only when the load flag matches the signed-in
// user.**

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  x FAIL  ' + m); } };

const src = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');

function lift(name, kw = 'function') {
    const at = src.indexOf(kw + ' ' + name + '(');
    if (at < 0) return null;
    const open = src.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
    }
    return null;
}

console.log('--- A. THE GUARD EXISTS AND IS KEYED TO A USER ---');
ok(/let _progressLoadedForUid = null;/.test(src),
   'A1 the load-state flag is declared');
ok(!/let _progressLoaded\s*=\s*(true|false)/.test(src),
   '⚠️⚠️ A2 IT IS A uid, NOT A BOOLEAN. Two students share a Chromebook in one ' +
   'browser profile more often than anyone plans for; a boolean stays true across ' +
   'a sign-out and lets the second student\u2019s flush write under the new uid');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. ⚠️⚠️ THE WRITE SIDE REFUSES UNLOADED STATE ---');
const refresh = lift('refreshProgressCache');
ok(refresh, 'B1 refreshProgressCache() exists');
ok(refresh && /_progressLoadedForUid !== currentUser\.uid/.test(refresh),
   '⚠️⚠️ B2 IT RETURNS EARLY UNLESS THE FLAG MATCHES THE SIGNED-IN USER. This one ' +
   'line is the fix. Without it, a tab switch during the await inside ' +
   'loadUserProgress() persists an empty map as the student\u2019s record');
ok(refresh && refresh.indexOf('_progressLoadedForUid') < refresh.indexOf('cacheWrite'),
   '⚠️ B3 THE GUARD COMES BEFORE THE WRITE. A check after the write is not a check');

// ⚠️ THE INVARIANT, NOT THE CALL SITE. Every caller must go through the guarded
// function; a direct cacheWrite to the progress key anywhere else reopens this.
const progWrites = [...src.matchAll(/cacheWrite\(PROGRESS_CACHE_KEY/g)].length;
ok(progWrites === 2,
   `⚠️⚠️ B4 EXACTLY TWO cacheWrite(PROGRESS_CACHE_KEY) SITES (found ${progWrites}): ` +
   `the one inside loadUserProgress() after a successful read, and the one inside ` +
   `the guarded refreshProgressCache(). A third would be an unguarded path back ` +
   `to this defect — route it through refreshProgressCache() instead`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. THE FLAG IS SET ONLY WHERE THE MAP IS REALLY POPULATED ---');
const load = lift('loadUserProgress', 'async function');
ok(load, 'C1 loadUserProgress() exists');
ok(load && /_progressLoadedForUid = null;/.test(load),
   '⚠️ C2 IT CLEARS THE FLAG ON ENTRY, so an early return, a throw, or a flush ' +
   'during the await cannot find a stale value from the previous load');
ok(load && (load.match(/_progressLoadedForUid = currentUser\.uid/g) || []).length === 2,
   '⚠️ C3 SET IN EXACTLY TWO PLACES: after a genuine cache hit, and after the ' +
   'Firestore read resolves');

// The catch block must NOT set it — a failed read means the empty map in memory
// is ignorance, not fact, and nothing may persist it.
const catchBlock = load ? load.slice(load.indexOf('} catch')) : '';
ok(catchBlock && !/_progressLoadedForUid\s*=/.test(catchBlock),
   '⚠️⚠️ C4 THE catch DOES NOT SET THE FLAG. A failed read leaves userProgress ' +
   'empty; if that counted as "loaded", a network blip would persist an empty map ' +
   'and reproduce the whole defect through a different door');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. ⚠️⚠️ AN EMPTY CACHE IS A MISS (THE SELF-HEAL) ---');
ok(load && /Object\.keys\(cached\.progress\)\.length > 0/.test(load),
   '⚠️⚠️ D1 AN EMPTY MAP DOES NOT COUNT AS A CACHE HIT. `typeof {} === "object"` ' +
   'is true, so the old test accepted `{}` as a complete answer. ⭐ THIS HALF IS ' +
   'THE SELF-HEAL: every already-poisoned cache in the wild falls through to ' +
   'Firestore on the student\u2019s next page load, with no console — which matters ' +
   'because students do not have one');

// Order matters: the length test must gate the early return, not run after it.
const hitBlock = load ? load.slice(load.indexOf('const cached'), load.indexOf('try {')) : '';
ok(hitBlock && hitBlock.indexOf('length > 0') < hitBlock.indexOf('return'),
   '⚠️ D2 THE LENGTH TEST GATES THE EARLY RETURN rather than following it');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- E. THE GATE THIS PROTECTS IS UNCHANGED ---');
// Not a fix — a tripwire. isUnlocked() is what turns an empty map into "lesson
// one only", and if its shape changes, the blast radius of a cache defect
// changes with it.
const unlocked = lift('isUnlocked');
ok(unlocked && /userProgress\[prev\.id\]\?\.passed === true/.test(unlocked),
   '⚠️ E1 isUnlocked() STILL READS `passed` OFF userProgress. This is the line ' +
   'that turns an empty map into "lesson one and nothing else" — it is why the ' +
   'symptom was total rather than partial, and it is recorded here so a future ' +
   'change to it is a deliberate one');
ok(unlocked && /if \(idx === 0\) return true;/.test(unlocked),
   'E2 the first lesson is unconditionally unlocked — the one the student was ' +
   'left with');

console.log('');
if (fail === 0) console.log(`PASS - ${pass} passing, 0 failing`);
else            console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
