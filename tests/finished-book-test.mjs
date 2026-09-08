// finished-book-test.mjs v1.0.0 — ROADMAP 67: A FINISHED BOOK MUST LEAVE THE
// "CONTINUE READING" ROW.
//
// Jake, 2026-09-08, of a book he had just finished: "It's still showing in my
// continue reading menu, although I'm definitely done with it. Got to the
// library from the finished page, in fact."
//
// ⚠️ THE ROW HAD NO CONCEPT OF "FINISHED" AT ALL. renderContinue() filtered on
// "has a progress timestamp" and nothing else, so the most recently touched
// book a student owns — which a book they just completed always is — sat at
// the top of the row forever.
//
// BEHAVIOURAL for isFinished(), which is the whole decision. STRUCTURAL for the
// game.js write side, which is Firestore- and DOM-coupled.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const game = readFileSync(new URL('../game.js',    import.meta.url), 'utf8');

function extractFn(s, name) {
    const start = s.indexOf(`function ${name}(`);
    if (start < 0) return null;
    let depth = 0;
    for (let j = s.indexOf('{', start); j < s.length; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}') { depth--; if (depth === 0) return s.slice(start, j + 1); }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// A — isFinished(): THE DECISION ITSELF
// ═══════════════════════════════════════════════════════════════════════════

const src = extractFn(html, 'isFinished');
ok(!!src, 'index.html defines isFinished()');
const isFinished = new Function(src + '; return isFinished;')();

// The authoritative answer.
ok(isFinished({}, { finishedAt: new Date() }) === true,
   'an explicit finishedAt stamp means finished');
ok(isFinished({}, { finishedAt: '2026-09-08T12:00:00Z' }) === true,
   'a finishedAt stamp is truthy-tested, so a serialized string still counts');

// ⚠️ THE LEGACY FALLBACK. Every book finished before game.js v3.51.0 has no
// stamp, including the one that produced this report.
ok(isFinished({}, { bodyIndex: 12, bodyTotal: 12, chapter: '12',
                    completedChapters: ['10', '11', '12'] }) === true,
   'legacy: parked on the last body chapter AND that chapter completed = finished');

// ⚠️ THE DIRECTION THAT MATTERS MOST. Hiding a book still being read deletes
// the child's way back to it from the row built to get them back to it.
ok(isFinished({}, { bodyIndex: 12, bodyTotal: 12, chapter: '12',
                    completedChapters: ['10', '11'] }) === false,
   'parked on the last chapter but NOT having completed it is still IN PROGRESS — ' +
   'they may be reading it right now');
ok(isFinished({}, { bodyIndex: 6, bodyTotal: 12, chapter: '6',
                    completedChapters: ['1','2','3','4','5','6'] }) === false,
   'mid-book is never finished, however many chapters are complete');

// ⚠️⚠️ THE TRAP THE OBVIOUS IMPLEMENTATION FALLS INTO. Front matter is
// typeable, lands in the SAME completedChapters array, and bodyTotal counts
// BODY chapters only — so `completedChapters.length >= bodyTotal` is wrong.
// ⚠️ THIS CASE IS CONSTRUCTED SO THE bodyIndex GUARD CANNOT ANSWER IT: the
// student IS parked on the last body chapter, and the count-only test WOULD
// say finished (5 completed >= 4 body chapters) purely because front matter
// padded the array — but they have not completed chapter 4 itself. An earlier
// draft of this assertion used a mid-book bodyIndex, which the guard rejected
// first, so it passed against the naive implementation too and proved nothing.
ok(isFinished({}, { bodyIndex: 4, bodyTotal: 4, chapter: '4',
                    completedChapters: ['0.1','0.2','1','2','3'] }) === false,
   '⚠️ front matter padding completedChapters past bodyTotal does NOT read as ' +
   'finished while the last body chapter is still unread');

// The same shape, but they HAVE finished the last chapter — the padding must
// not stop a genuinely finished book from being recognised either.
ok(isFinished({}, { bodyIndex: 4, bodyTotal: 4, chapter: '4',
                    completedChapters: ['0.1','0.2','1','2','3','4'] }) === true,
   'front matter in the array does not prevent a genuinely finished book from counting');

// Degenerate documents must never read as finished.
ok(isFinished({}, null) === false, 'no progress document is not finished');
ok(isFinished({}, {}) === false, 'an empty progress document is not finished');
ok(isFinished({}, { bodyIndex: 3, chapter: '3', completedChapters: ['3'] }) === false,
   'a missing bodyTotal is not finished — the denominator is unknown, so do not guess');
ok(isFinished({}, { bodyTotal: 3, chapter: '3', completedChapters: ['3'] }) === false,
   'a missing bodyIndex is not finished — position within the body is unknown');
ok(isFinished({}, { bodyIndex: 3, bodyTotal: 3, chapter: '3',
                    completedChapters: null }) === false,
   'a null completedChapters does not throw and does not read as finished');
ok(isFinished({}, { bodyIndex: 3, bodyTotal: 3, chapter: 3,
                    completedChapters: [3] }) === true,
   'numeric chapter ids match string ones — both sides are String()-coerced');

// ═══════════════════════════════════════════════════════════════════════════
// B — renderContinue() ACTUALLY APPLIES IT
// ═══════════════════════════════════════════════════════════════════════════

const rc = extractFn(html, 'renderContinue') || '';
ok(/\.filter\(x => !isFinished\(x\.book, userProgress\[x\.id\]\)\)/.test(rc),
   'renderContinue() filters finished books out of the Continue-reading row');

// ⚠️ THE MAIN SHELF MUST BE UNAFFECTED. A finished book still belongs in the
// library — this item is about one row, not about hiding books.
const rb = extractFn(html, 'renderBooks') || '';
ok(!/isFinished/.test(rb),
   'renderBooks() does NOT filter on isFinished — a finished book stays on the shelf');

// ═══════════════════════════════════════════════════════════════════════════
// C — game.js WRITES THE STAMP, ONCE, AT THE COMPLETION MOMENT
// ═══════════════════════════════════════════════════════════════════════════

ok(/let bookJustFinished = false;/.test(game),
   'game.js declares the completion flag at module scope');
ok(/\.\.\.\(bookJustFinished \? \{ finishedAt: new Date\(\) \} : \{\}\)/.test(game),
   'finishedAt rides in the existing progress write, not a new one');

// ⚠️ THE FLUSH IS EXPLICIT AND THAT IS LOAD-BEARING. pagehide only does
// walSave()/flushSessionsNow() (localStorage; no Firestore progress write),
// and visibilitychange:hidden reaches flushAll() only past a time/delta gate.
// A student who finishes and immediately clicks "Back to the library" — the
// button the completion modal itself draws — can satisfy neither.
const completionAt = game.indexOf('bookJustFinished = true;');
ok(completionAt > -1, 'game.js sets the flag at the completion moment');
const after = completionAt > -1 ? game.slice(completionAt, completionAt + 200) : '';
ok(/await flushAll\(/.test(after),
   '⚠️ the completion path flushes explicitly — neither pagehide nor the gated ' +
   'hidden-flush can be relied on to carry the stamp before the tab goes away');

// ⚠️ SET, NEVER CLEARED. A student re-reading a finished book still finished it.
ok((game.match(/bookJustFinished = true/g) || []).length === 1,
   'the flag is set in exactly one place — the single completion branch');
ok(!/bookJustFinished = false;\s*$/m.test(game.split('let bookJustFinished')[1] || ''),
   'the flag is never reset after the declaration, so the stamp cannot be un-written');

console.log(fail
    ? `\nfinished-book-test: ${pass} passed, ${fail} FAILED`
    : `finished-book-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
