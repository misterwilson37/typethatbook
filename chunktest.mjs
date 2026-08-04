// Replays the v3.9.2 chunked sprint rollup against the firestore.rules v2.2.0
// caps (sprints <= 200, seconds <= 86400), including a mid-run write failure,
// checking for lost sprints, duplicated sprints, and rule violations.

const SPRINTS_PER_ROLLUP = 200;

function runRollup(pendingIn, failOnChunk = -1) {
  let pendingSessions = pendingIn.slice();
  const sessionsBeingWritten = pendingSessions.slice();
  const stored = [];
  let ok = true, written = 0, chunkIdx = 0;

  try {
    for (let i = 0; i < sessionsBeingWritten.length; i += SPRINTS_PER_ROLLUP) {
      const chunk = sessionsBeingWritten.slice(i, i + SPRINTS_PER_ROLLUP);
      const totals = chunk.reduce((a, s) => ({
        seconds: a.seconds + s.seconds, chars: a.chars + s.chars,
        mistakes: a.mistakes + s.mistakes
      }), { seconds: 0, chars: 0, mistakes: 0 });

      if (chunkIdx === failOnChunk) throw new Error('simulated permission-denied');

      stored.push({ sprintCount: chunk.length,
                    seconds: Math.min(totals.seconds, 86400),
                    sprints: chunk });
      written += chunk.length;
      pendingSessions = pendingSessions.slice(chunk.length);
      chunkIdx++;
    }
  } catch (e) { ok = false; }

  return { ok, written, stored, pendingSessions };
}

function check(label, pending, failOnChunk) {
  const r = runRollup(pending, failOnChunk);

  // Rule compliance on every stored document
  const badSize = r.stored.filter(d => d.sprints.length > 200).length;
  const badSecs = r.stored.filter(d => d.seconds > 86400).length;

  // Accounting: stored + still-pending must equal the input exactly, once each
  const storedIds = r.stored.flatMap(d => d.sprints.map(s => s.id));
  const pendingIds = r.pendingSessions.map(s => s.id);
  const all = storedIds.concat(pendingIds).sort((a, b) => a - b);
  const expected = pending.map(s => s.id).sort((a, b) => a - b);
  const lost = expected.filter(id => !all.includes(id)).length;
  const dupes = storedIds.length - new Set(storedIds).size;
  const accounted = JSON.stringify(all) === JSON.stringify(expected);

  console.log(
    `${label.padEnd(38)} docs=${String(r.stored.length).padStart(2)} ` +
    `stored=${String(storedIds.length).padStart(3)} pending=${String(pendingIds.length).padStart(3)} ` +
    `| >200:${badSize} >86400s:${badSecs} lost:${lost} dupes:${dupes} ` +
    `| ${badSize + badSecs + lost + dupes === 0 && accounted ? 'PASS' : 'FAIL'}`
  );
}

const mk = (n, secs = 30) =>
  Array.from({ length: n }, (_, i) => ({ id: i, seconds: secs, chars: 150, mistakes: 3 }));

check('normal 44-min period (88 sprints)', mk(88), -1);
check('exactly at the cap (200)', mk(200), -1);
check('one over the cap (201)', mk(201), -1);
check('WAL pile-up (450)', mk(450), -1);
check('WAL pile-up, 2nd chunk denied', mk(450), 1);
check('WAL pile-up, 1st chunk denied', mk(450), 0);
check('absurd local total (300 x 500s)', mk(300, 500), -1);
check('corrupt total (200 x 900s = 180000)', mk(200, 900), -1);

// And the pre-fix behaviour, for contrast
const unchunked = mk(450);
const t = unchunked.reduce((a, s) => a + s.seconds, 0);
console.log(`\nv3.9.1 unchunked, same 450 sprints: sprints=${unchunked.length} ` +
            `seconds=${t} -> rules verdict: ` +
            `${unchunked.length > 200 || t > 86400 ? 'DENIED (and WAL kept, so permanent)' : 'allowed'}`);
