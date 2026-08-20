// week-anchor-test.mjs v1.0.1 — the audit's week anchor must equal the app's.
//
// v1.0.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
//
// ⚠️ WHY THIS HARNESS EXISTS. reports.html v2.10.0 anchored the school week on
// MONDAY. game.js and learn.js anchor it on SATURDAY (Sat-Fri). Nothing threw:
// the stored weekStart simply never equalled the computed one, no day ever fell
// inside the week, and the audit's not-covered branch swallowed every student.
// Ninety students were reported clean while none had been examined.
//
// The failure was invisible from inside either file — both were internally
// consistent — so it can only be caught by comparing them, which is what this
// does: it lifts BOTH functions from the shipped sources and asserts they agree,
// including on the real observed value (a stored weekStart of "2026-08-15" for a
// student who typed on the 17th and 18th).
//
// ⚠️ If getWeekStart() ever moves into a shared module, delete this harness and
// the duplication it guards. Until then, do not remove it.

// ⚠️ v1.1.0 (Round 19) — THE THIRD ANCHOR MOVED. reports.html carried its own
// weekStartOf() to support the week-counter audit; that audit is DELETED
// (reports.html v2.16.0, HANDOFF §0.0) and the function went with it. The
// canonical Saturday anchor now lives in daylog.js, which BOTH page controllers
// import — so this harness compares learn.js's own getWeekStart() against the
// shared module, and game.js's against it too. That is a stronger check than the
// old one: it is the anchor the student's own screen is drawn from.
process.env.TZ = 'America/Chicago';

import { readFileSync } from 'fs';
import { weekStartOf as sharedWeekStart } from '../daylog.js';
const learn = readFileSync(new URL('../learn.js', import.meta.url), 'utf8');
const game  = readFileSync(new URL('../game.js',  import.meta.url), 'utf8');

function lift(src, name){
  const i = src.indexOf('function '+name+'('); if(i<0) return null;
  let d=0,j=src.indexOf('{',i); for(;j<src.length;j++){ if(src[j]==='{')d++; else if(src[j]==='}'){d--; if(!d)break;} }
  return src.slice(i,j+1);
}
const appFn  = new Function(lift(learn,'getWeekStart')+'; return getWeekStart;')();
const gameFn = new Function(lift(game, 'getWeekStart')+'; return getWeekStart;')();
const audFn  = (d) => sharedWeekStart(d);

let fail=0;
for (const d of ['2026-08-15','2026-08-16','2026-08-17','2026-08-18','2026-08-21','2026-08-22','2026-01-01','2026-12-31']) {
  const a = appFn(new Date(d+'T12:00:00'));
  const g = gameFn(new Date(d+'T12:00:00'));
  const b = audFn(d);
  const okk = a===b && g===b;
  if(!okk) fail++;
  console.log((okk?'ok  ':'FAIL')+`  ${d}  learn=${a}  game=${g}  daylog=${b}`);
}
const obs = audFn('2026-08-17');
console.log((obs==='2026-08-15'?'ok  ':'FAIL')+`  observed student: 08-17 -> ${obs} (expect 2026-08-15)`);
if(obs!=='2026-08-15') fail++;
console.log(fail? `\n${fail} FAILED` : '\nall week anchors agree (learn.js, game.js, daylog.js)');
process.exit(fail?1:0);
