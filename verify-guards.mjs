// Lifts flushAll() out of game.js and flushStats() out of learn.js BY TEXT —
// the shipping functions, not a copy — and runs them against a stub inner with
// N callers arriving in the same tick. Same approach as the §B.7 harness.
import { readFileSync } from 'fs';

function lift(file, fnName) {
  const src = readFileSync(file, 'utf8');
  const start = src.indexOf(`async function ${fnName}(`);
  if (start < 0) throw new Error(`${fnName} not found in ${file}`);
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
  }
  return src.slice(start, end);
}

async function exercise(file, fnName, slotName, innerName, callers) {
  const body = lift(file, fnName);
  let concurrent = 0, maxConcurrent = 0, runs = 0;

  const factory = new Function(`
    let ${slotName} = null;
    const __track = arguments[0];
    async function ${innerName}(reason, final) { await __track(); }
    ${body}
    return ${fnName};
  `);

  const fn = factory(async () => {
    runs++; concurrent++; maxConcurrent = Math.max(maxConcurrent, concurrent);
    for (let k = 0; k < 4; k++) await new Promise(r => setTimeout(r, 1));
    concurrent--;
  });

  await Promise.all(Array.from({ length: callers }, (_, i) => fn('c' + i, i === callers - 1)));
  return { runs, maxConcurrent, usesWhile: /while\s*\(/.test(body) };
}

const targets = [
  ['/home/claude/work/game.js',  'flushAll',   '_flushInFlight',      '_flushAllInner'],
  ['/home/claude/work/learn.js', 'flushStats', '_learnFlushInFlight', '_flushStatsInner'],
];

let allPass = true;
for (const [file, fn, slot, inner] of targets) {
  for (const callers of [2, 3, 6, 12]) {
    const r = await exercise(file, fn, slot, inner, callers);
    const pass = r.maxConcurrent === 1 && r.runs === callers;
    if (!pass) allPass = false;
    console.log(
      `${file.split('/').pop().padEnd(9)} ${fn.padEnd(11)} callers=${String(callers).padStart(2)} ` +
      `runs=${String(r.runs).padStart(2)} maxConcurrent=${r.maxConcurrent} ` +
      `while=${r.usesWhile} ${pass ? 'PASS' : 'FAIL — overlapping runs'}`
    );
  }
}
console.log('\n' + (allPass
  ? 'ALL PASS — no call depth produced overlapping inner runs, and no caller was dropped.'
  : 'FAILURES ABOVE'));
