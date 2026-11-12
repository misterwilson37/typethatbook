// victory-lap-pool-test.mjs v1.0.0 — Round 169. "robinguessed".
//
// Jake, 2026-11-12: a student playing the game at the end of a lesson had to type
// "robinguessed". The lesson says "robin guessed the garden...". run-grade.js chunkSequence()
// cuts a long step into runs AT a space and that space belongs to neither run; learn2.js's
// Victory Lap then rebuilt the passage by concatenating the runs, so every run boundary merged
// two words. Driven here against the REAL lesson corpus: every target the game can show must be
// a word that is actually in the lesson.
import { readFileSync } from 'node:fs';
const { chunkSequence } = await import('../run-grade.js');
const { poolRunSequences, targetsFromSequence } = await import('../game-shell.js');

let pass = 0, fail = 0; const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const corpus = JSON.parse(readFileSync(new URL('./fixtures/lessons-export.json', import.meta.url), 'utf8')).lessons;
const textOf = (st) => st.type === 'sentence_list' ? (st.sentences || []).join(' ')
    : st.type === 'word_list' ? (st.words || []).join(' ') : st.type === 'passage' ? (st.text || '') : '';

let steps = 0, boundaries = 0, mergedOld = 0, mergedNew = 0, sawRobin = false;
for (const L of corpus) for (const st of (L.steps || [])) {
    const text = textOf(st);
    if (!text) continue;
    const chunks = chunkSequence(text.split(''));
    if (chunks.length < 2) continue;
    steps++; boundaries += chunks.length - 1;
    const words = new Set(text.split(/\s+/).filter(Boolean));
    const runs = chunks.map(c => ({ sequence: c }));
    const oldPool = [].concat.apply([], runs.map(r => r.sequence));          // what shipped
    for (const t of targetsFromSequence(oldPool)) if (!words.has(t)) { mergedOld++; if (t === 'robinguessed') sawRobin = true; }
    for (const t of targetsFromSequence(poolRunSequences(runs))) if (!words.has(t)) mergedNew++;
}
ok(steps > 0 && boundaries > 0, `the corpus has multi-run prose steps (${steps} steps, ${boundaries} run boundaries)`);
ok(mergedOld > 0, `⚠️ the old concat really did merge words (${mergedOld} merged targets across the corpus)`);
ok(sawRobin, '⭐ …including "robinguessed" — the word Jake saw');
ok(mergedNew === 0, `⭐⭐ the fixed pool: every target is a real word of its lesson (${mergedNew} merged)`);
ok(poolRunSequences([{ sequence: ['a', 'b'] }, { sequence: [' ', 'c'] }]).join('') === 'ab c',
   'a boundary that already has a space gets no second one');
ok(/const pool = poolRunSequences\(sameStep\);/.test(readFileSync(new URL('../learn2.js', import.meta.url), 'utf8')),
   'learn2.js builds the Victory Lap pool with it');

console.log(fail ? `\nvictory-lap-pool-test: ${pass} passed, ${fail} FAILED` : `\nvictory-lap-pool-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   ✗ ' + f)); process.exit(1); }
