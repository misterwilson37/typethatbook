// self-hosted-fonts-test.mjs v1.0.0 — Round 135 (Tory).
//
// ⚠️⚠️ NO PAGE MAY LOAD FONTS FROM GOOGLE, AND EVERY LOCAL FONT MUST EXIST.
//
// Every page used to load its fonts from fonts.googleapis.com, handing Google each
// visitor's IP address — a third-party disclosure, on a site used by children
// under 13, that a privacy notice would have to name. Round 135 self-hosts them.
//
// ⭐⭐ AND THIS HARNESS EXISTS BECAUSE THE FIRST ATTEMPT BROKE EVERY PAGE. The copy
// step failed silently (the build shell has no brace expansion), the HTML edit ran
// anyway, and all seven pages briefly pointed at a fonts.css that did not exist.
// The pages would have loaded with fallback fonts and no error anywhere. Part B is
// the check that would have caught it.

import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

const pages = readdirSync(ROOT).filter(f => f.endsWith('.html'));

console.log('\nA — ⚠️⚠️ NO PAGE CONTACTS GOOGLE FONTS');
for (const p of pages) {
    const s = readFileSync(path.join(ROOT, p), 'utf8');
    ok(!/fonts\.(googleapis|gstatic)\.com/.test(s), `${p} makes no request to Google Fonts`);
}

console.log('\nB — ⚠️⚠️⚠️ EVERY FONT THE STYLESHEET NAMES IS ACTUALLY THERE');
const cssPath = path.join(ROOT, 'fonts', 'fonts.css');
ok(existsSync(cssPath), 'B1 fonts/fonts.css exists');
const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : '';
const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map(m => m[1]);
ok(urls.length === 7, `B2 it declares the seven faces the pages asked for (${urls.length})`);
for (const u of urls) ok(existsSync(path.join(ROOT, 'fonts', u)), `B3 ${u} exists`);

console.log('\nC — EVERY PAGE THAT USES THESE FAMILIES LINKS THE STYLESHEET');
for (const p of pages) {
    const s = readFileSync(path.join(ROOT, p), 'utf8');
    if (!/Courier Prime|Bitter|IM Fell English/.test(s)) continue;
    ok(/href="fonts\/fonts\.css"/.test(s), `${p} links fonts/fonts.css`);
}

console.log('\nD — ⭐ THE LICENCES TRAVEL WITH THE FILES');
for (const f of ['courier-prime', 'bitter', 'im-fell-english']) {
    const l = path.join(ROOT, 'fonts', `LICENSE-${f}.txt`);
    ok(existsSync(l) && /Open Font License|OFL/i.test(readFileSync(l, 'utf8')),
       `${f}: SIL Open Font License text is present`);
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
