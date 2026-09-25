// auth-cleanup-sync-test.mjs v1.0.0 — Round 145.
//
// ⚠️⚠️ THE SIGN-IN ACCOUNT CLEANUP: THE PAGE, THE SCRIPT AND THE POLICY AGREE.
//
// Jake will not need scripts/auth-cleanup.py for a year or more, and will not remember
// it exists. The How-to on the reports page is how he finds it — so every command the
// page shows must be one the script's own docstring shows, word for word, and the
// script's numbers must be the site's numbers. It also runs tests/auth-cleanup-test.py,
// which drives the real script against fakes.

import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0; const fails = []; const notes = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

const script = read('scripts/auth-cleanup.py');
const doc = script.slice(script.indexOf('"""') + 3, script.indexOf('"""', script.indexOf('"""') + 3));
const reports = read('reports.html');

console.log('\nA — ⚠️⚠️⚠️ EVERY COMMAND ON THE PAGE IS IN THE SCRIPT, VERBATIM');
const howto = reports.slice(reports.indexOf('<details class="goals-panel hidden" id="privacy-howto">'),
                            reports.indexOf('</details>', reports.indexOf('id="privacy-howto"')));
const cmds = [...howto.matchAll(/<code data-cmd>([^<]+)<\/code>/g)].map(m => m[1].replace(/&amp;/g, '&'));
ok(cmds.length === 9, `A1 the How-to shows the nine commands (${cmds.length})`);
for (const c of cmds) ok(doc.includes(c), `A2 in the docstring: ${c}`);
ok(/class="howto-copy"/.test(howto) && /navigator\.clipboard\.writeText\(code\.textContent\)/.test(reports),
   'A3 each has a Copy button that copies exactly the text shown');
ok(/privacy-howto'\)\?\.classList\.toggle\('hidden', !isSuper\(\)\)/.test(reports), 'A4 super-admin only');

console.log('\nB — ⚠️⚠️ THE SCRIPT\u2019S NUMBERS ARE THE SITE\u2019S NUMBERS');
const pyMonths = (/^RETENTION_MONTHS = (\d+)/m.exec(script) || [])[1];
const jsMonths = (/const RETENTION_MONTHS = (\d+);/.exec(reports) || [])[1];
ok(pyMonths && pyMonths === jsMonths, `B1 retention months match the Retention panel (${pyMonths} / ${jsMonths})`);
const proj = (/projectId: "([^"]+)"/.exec(read('firebase-config.js')) || [])[1];
ok(new RegExp(`^PROJECT_ID = '${proj}'`, 'm').test(script) && doc.includes(`set-quota-project ${proj}`),
   `B2 the project id matches firebase-config.js (${proj})`);
const cfg = read('firebase-config.js');
const admins = [...cfg.slice(cfg.indexOf('export const ADMIN_EMAILS'), cfg.indexOf('];', cfg.indexOf('export const ADMIN_EMAILS')))
                  .matchAll(/"([^"]+)"/g)].map(m => m[1].toLowerCase()).sort();
const prot = [...(/^PROTECTED_EMAILS = \[([^\]]*)\]/m.exec(script) || [, ''])[1].matchAll(/'([^']+)'/g)]
                  .map(m => m[1].toLowerCase()).sort();
ok(admins.length > 0 && JSON.stringify(admins) === JSON.stringify(prot),
   '⚠️⚠️ B3 the script protects exactly the admin emails in firebase-config.js');
const host = read('CNAME').trim();
ok(doc.includes(`https://${host}/scripts/auth-cleanup.py`) && existsSync(path.join(ROOT, 'scripts', 'auth-cleanup.py')),
   'B4 the curl URL is this site, and the file is where the site serves it');
ok(!/BEGIN PRIVATE KEY|service[_-]?account\.json|private_key/i.test(script.replace(/^#.*$/gm, '')),
   '⚠️ B5 the script carries no key and never asks for one — it runs as Jake\u2019s own account');

console.log('\nC — ⚠️ THE POLICY DESCRIBES THE SAME CLOCK');
const pol = read('privacy.html').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
ok(/sign-in account is deleted once their records have been removed and the account hasn't been used for 24 months/.test(pol),
   'C1 the policy: records gone AND unused 24 months');
ok(/records already removed AND not used since/.test(script) && /records_exist/.test(script),
   'C2 the script: the same two conditions');

console.log('\nD — THE REAL SCRIPT, AGAINST FAKES');
const py = spawnSync('python3', [path.join(ROOT, 'tests', 'auth-cleanup-test.py')], { encoding: 'utf8' });
if (py.error) notes.push('python3 is not available here, so tests/auth-cleanup-test.py did not run');
else ok(py.status === 0, `D1 tests/auth-cleanup-test.py passes (${(py.stdout.match(/PASS — (\d+) ok/) || [, '?'])[1]} checks)`);

for (const n of notes) console.log('  note  ' + n);
console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
