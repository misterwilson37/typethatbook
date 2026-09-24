// privacy-policy-test.mjs v1.0.0 — Round 138 (Plantin II). ROADMAP 135d.
//
// ⚠️⚠️⚠️ EVERY PROMISE THE PRIVACY POLICY MAKES IS CHECKED AGAINST THE CODE THAT
//        KEEPS IT.
//
// privacy.html is the online notice COPPA requires (16 CFR 312.4(d)) and the page
// a parent actually reads. ⭐ A policy that drifts from the code is worse than none:
// it is a false statement to a parent. So each claim is pinned to its source — the
// retention constant in reports.html, the leaderboard filter in game.js, SECURITY.md
// — and changing one without the other fails here, not in front of a parent.

import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');
let pass = 0; const fails = []; const notes = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };

ok(existsSync(path.join(ROOT, 'privacy.html')), 'privacy.html exists');
const pol = read('privacy.html');
const text = pol.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const sec = read('SECURITY.md');
const reports = read('reports.html');
const game = read('game.js');

console.log('\nA — ⚠️⚠️ LINKED FROM THE HOME PAGE AND WHEREVER INFORMATION IS COLLECTED');
ok(/href="\.\/privacy\.html"[^>]*>Privacy Policy</.test(read('index.html')),
   'A1 the home page carries a clearly labelled "Privacy Policy" link');
for (const f of readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
    const s = read(f);
    if (!/id="login-btn"/.test(s)) continue;
    ok(/href="\.\/privacy\.html"/.test(s), `A2 ${f} has a sign-in button, and links the policy`);
}

console.log('\nB — WHAT 312.4(d) REQUIRES');
ok(/Jake Wilson/.test(text), 'B1 the operator is named');
ok(/jacob\.v\.wilson@gmail\.com/.test(text), 'B2 an email address is given');
ok(/review/.test(text) && /deleted/.test(text) && /no further information be collected/.test(text),
   'B3 the three parental rights: review, delete, refuse further collection');
ok(/confirm the request through the school/.test(text),
   'B4 and how a parent\u2019s identity is confirmed before acting (312.6)');
for (const ph of ['[MAILING ADDRESS]', '[TELEPHONE]'])
    if (text.includes(ph)) notes.push(`privacy.html still says ${ph} \u2014 COPPA requires the operator\u2019s address and phone`);

console.log('\nC — ⚠️⚠️⚠️ EACH PROMISE MATCHES THE CODE THAT KEEPS IT');
const months = (/const RETENTION_MONTHS = (\d+);/.exec(reports) || [])[1];
ok(months && new RegExp(`${months} months`).test(text) && new RegExp(`${months} months`).test(sec),
   `⚠️⚠️ C1 retention: the policy, SECURITY.md and the Retention panel all say ${months} months`);
ok(/within 30 days/.test(text) && /within 30 days/.test(sec), 'C2 deletion requests: 30 days in both documents');
for (const svc of ['Google Firebase', 'reCAPTCHA', 'GitHub Pages'])
    ok(text.includes(svc) && sec.includes(svc), `C3 "${svc}" is disclosed in both documents`);
ok(/no advertisements/i.test(text) && /never sell/i.test(text), 'C4 no ads, no selling');
// the leaderboard promise: initials only, and opting out really hides you
// ⚠️ ANCHORED ON THE REAL ENTRY. The first `lbOwnEntry = {` in game.js is the
// empty `{}` fallback, and slicing from it reads nothing — the first draft of this
// assertion failed against correct code for exactly that reason.
const lbStart = game.indexOf('        lbOwnEntry = {\n');
// ⚠️ COMMENTS STRIPPED, AND ONLY FIELD KEYS COUNT. The entry carries a comment that
// mentions email; the question is whether a FIELD does.
const lbEntry = game.slice(lbStart, game.indexOf('};', lbStart)).replace(/^\s*\/\/.*$/gm, '');
ok(/initials:/.test(lbEntry) && !/\b(displayName|email)\s*:/.test(lbEntry),
   '⚠️⚠️ C5 "other students see only initials" — the leaderboard entry carries no name or email');
ok(/!e\.leaderboardOptOut/.test(game), '⚠️ C6 "students can hide themselves" — the board filters them out');
ok(!/signInAnonymously/.test(game) && /nothing about them is stored/.test(text),
   'C7 "nothing about a guest is stored" — there is no anonymous sign-in anywhere');
ok(/Accounts with no typing ever recorded are never removed automatically/.test(sec),
   'C8 SECURITY.md\u2019s description of the retention panel matches its review rule');

console.log('\nD — ⭐ THE POLICY PAGE ITSELF CALLS NO ONE');
const ext = [...pol.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map(m => m[1]);
ok(ext.length === 0, `D1 privacy.html loads nothing from another site (${ext.join(', ') || 'none'})`);

// ⚠️⚠️ THE CONSENT CLAIM IS THE ONE THIS HARNESS CANNOT CHECK AGAINST CODE — it is a
// fact about an agreement with the district, not about the site. Round 138 asserted
// it before it was true. So while the policy is a draft it must SAY it is a draft,
// and it must not claim the approval in its visible text.
if (/PENDING DISTRICT REVIEW/.test(text) || /\bDraft\b/.test(text))
    notes.push('privacy.html is a DRAFT pending district review \u2014 do not publish it as final');
ok(!/used as part of classroom instruction, with the school district's approval/.test(text)
   || !/PENDING DISTRICT REVIEW|\bDraft\b/.test(text),
   '⚠️⚠️⚠️ E1 the policy never claims district approval while it is still marked a draft');
ok(!/with the school district's approval/.test(text) || !/\[PENDING/.test(text),
   'E2 and never claims it alongside the pending placeholder');
for (const n of notes) console.log('  note  ' + n);
console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
