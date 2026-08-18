// week-anchor-test.mjs v1.0.0 — the audit's week anchor must equal the app's.
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

import { readFileSync } from 'fs';
const learn = readFileSync('./learn.js','utf8');
const rep   = readFileSync('./reports.html','utf8');

function lift(src, name){
  const i = src.indexOf('function '+name+'('); if(i<0) return null;
  let d=0,j=src.indexOf('{',i); for(;j<src.length;j++){ if(src[j]==='{')d++; else if(src[j]==='}'){d--; if(!d)break;} }
  return src.slice(i,j+1);
}
const appFn = new Function(lift(learn,'getWeekStart')+'; return getWeekStart;')();
const audFn = new Function(lift(rep,'weekStartOf')+'; return weekStartOf;')();

let fail=0;
for (const d of ['2026-08-15','2026-08-16','2026-08-17','2026-08-18','2026-08-21','2026-08-22','2026-01-01','2026-12-31']) {
  const a = appFn(new Date(d+'T12:00:00'));
  const b = audFn(d);
  const okk = a===b;
  if(!okk) fail++;
  console.log((okk?'ok  ':'FAIL')+`  ${d}  app=${a}  audit=${b}`);
}
const obs = audFn('2026-08-17');
console.log((obs==='2026-08-15'?'ok  ':'FAIL')+`  observed student: 08-17 -> ${obs} (expect 2026-08-15)`);
if(obs!=='2026-08-15') fail++;
console.log(fail? `\n${fail} FAILED` : '\nall week anchors agree');
process.exit(fail?1:0);
