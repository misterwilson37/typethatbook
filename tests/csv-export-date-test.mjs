// csv-export-date-test.mjs v1.0.0 — ROADMAP 66: THE BOOKS CSV EXPORT NAMES ITS
// FILE FROM A LOCAL DAY, NOT A UTC ONE.
//
// ⚠️ WHY A DEDICATED FILE FOR A ONE-LINE FIX. This is the same `toISOString()`
// -as-day-key mistake this project has now found and fixed in
// `sessionLogAdopt()`, `reports.html` (twice), and `generatePractice()` — the
// class is the point, not this cosmetic instance (a filename nothing reads
// back). Pinning it, however small, is cheaper than finding it a fifth time.
//
// STRUCTURAL: admin.js's DOM/Firebase coupling makes running the actual click
// handler impractical without a browser; this checks the source directly.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const failures = [];
const ok = (c, l) => { if (c) pass++; else { fail++; failures.push(l); } };

const admin = readFileSync(new URL('../admin.js', import.meta.url), 'utf8');

ok(/import\s*\{\s*localDateStr\s*\}\s*from\s*["']\.\/daylog\.js["']/.test(admin),
   'admin.js imports localDateStr from daylog.js');

const exportAt = admin.indexOf("downloadCsv('typethatbook-books-");
ok(exportAt > -1, 'the books-export downloadCsv() call still exists');
const nearby = exportAt > -1 ? admin.slice(Math.max(0, exportAt - 200), exportAt) : '';

// ⚠️ THE EXACT LINE THIS ITEM IS ABOUT MUST BE GONE FROM THE EXPORT HANDLER
// ITSELF — not from the whole file, which still legitimately mentions the old
// literal in this version's own changelog entry describing what changed.
ok(!/new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/.test(nearby),
   'the UTC-day filename stamp (`new Date().toISOString().slice(0, 10)`) is gone from the export handler');

ok(/const stamp = localDateStr\(\);/.test(nearby),
   'the export filename stamp comes from localDateStr(), not toISOString()',
   );

// ⚠️ NOT todayInSchoolTZ() — that fixed-IANA-zone helper exists for a Cloud
// Functions container, whose local zone is UTC. This code runs in Jake's own
// browser, where the machine's own clock already IS local.
ok(!/todayInSchoolTZ/.test(nearby),
   'the export does not reach for the Cloud-Functions-specific school-timezone helper');

console.log(fail
    ? `\ncsv-export-date-test: ${pass} passed, ${fail} FAILED`
    : `csv-export-date-test: all ${pass} assertions pass`);
if (fail) { failures.forEach(f => console.log('   \u2717 ' + f)); process.exit(1); }
