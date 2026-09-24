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
ok(/href="\.\/privacy\.html"[^>]*>Privacy &amp; Data Policy</.test(read('index.html')),
   'A1 the home page footer carries a clearly labelled "Privacy & Data Policy" link');
// ⚠️⚠️ THE MAIN MENU TOO — the reviewer looks in "the footer of the site, or maybe in
// the main menu", and the arcade has no footer at all.
const nav = read('site-nav.js');
ok(/privacy\.href = '\.\/privacy\.html'/.test(nav) && /nav\.appendChild\(privacy\)/.test(nav),
   '⚠️⚠️ A3 the shared main menu carries a Privacy link on every page that mounts it');
ok(/site-nav\.js/.test(read('arcade.html')),
   'A4 and the arcade — which has no footer — mounts that menu, so it is covered');
for (const f of readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
    const s = read(f);
    if (!/id="login-btn"/.test(s)) continue;
    ok(/href="\.\/privacy\.html"/.test(s), `A2 ${f} has a sign-in button, and links the policy`);
}

console.log('\nB — WHAT 312.4(d) REQUIRES');
ok(/created, and is run, by Jake Wilson/.test(text) && /Jake Wilson, operator of TypeThatBook/.test(text),
   'B1 the operator is named, in the introduction and in the contact block (312.4(d)(1))');
// ⚠️ JAKE, 2026-09-24: *"don't include my email or anything."* Pinned so a later edit
// cannot quietly put a personal address back on a public page.
ok(!/jacob\.v\.wilson|@gmail\.com/i.test(pol), 'B2 no personal email anywhere on the page');
// ⭐ ROUND 143: the contact is a FORWARDING address and a dedicated number, so the
// policy can carry them without exposing anything personal.
const EMAIL = 'privacy@misterwilson.org', PHONE = '(615) 379-7226';
ok(text.includes(EMAIL) && sec.includes(EMAIL), `B2b both documents give the same email (${EMAIL})`);
ok(text.includes(PHONE) && sec.includes(PHONE), `B2c and the same phone (${PHONE})`);
ok(/href="tel:\+16153797226"/.test(pol), 'B2d the phone link dials the number it displays');
ok(/review/.test(text) && /deleted/.test(text) && /no further information be collected/.test(text),
   'B3 the three parental rights: review, delete, refuse further collection');
ok(/confirm the request through the school/.test(text),
   'B4 and how a parent\u2019s identity is confirmed before acting (312.6)');
// ⚠️ THE TWO FIELDS STILL MISSING. 312.4(d)(1) lists name, address, phone and email;
// phone and email are in. Notes, not failures — Jake has decided to add them later.
if (!/Jake Wilson/.test(text)) notes.push('the policy does not name the operator \u2014 COPPA 312.4(d)(1) lists a name');
if (!/P\.?\s?O\.? Box|\d+ [A-Z][a-z]+ (Street|St|Road|Rd|Ave|Avenue|Drive|Dr|Pike|Blvd)/.test(text))
    notes.push('the policy has no mailing address yet \u2014 COPPA 312.4(d)(1) lists one');

console.log('\nC — ⚠️⚠️⚠️ EACH PROMISE MATCHES THE CODE THAT KEEPS IT');
const months = (/const RETENTION_MONTHS = (\d+);/.exec(reports) || [])[1];
ok(months && new RegExp(`${months} months`).test(text) && new RegExp(`${months} months`).test(sec),
   `⚠️⚠️ C1 retention: the policy, SECURITY.md and the Retention panel all say ${months} months`);
ok(/within 30 days/.test(text) && /within 30 days/.test(sec), 'C2 deletion requests: 30 days in both documents');
for (const svc of ['Google Firebase', 'reCAPTCHA', 'GitHub Pages'])
    ok(text.includes(svc) && sec.includes(svc), `C3 "${svc}" is disclosed in both documents`);
ok(/No advertising\. No data mining\. No selling\./.test(text), 'C4 no ads, no data mining, no selling \u2014 Jake\u2019s three');
ok(/every quarter/.test(text) && /every quarter/.test(sec),
   '⚠️ C9 the quarterly retention check is promised in BOTH documents');
ok(/The privacy policy promises this every quarter/.test(reports),
   'C10 and the Retention panel itself says so, so the tool and the promise agree');
ok(!/getAnalytics|gtag\(|google-analytics/.test(game + reports + read('index.html')) && /no analytics or tracking/.test(text),
   'C11 "no analytics or tracking" \u2014 none is loaded anywhere');
ok(!/signInWithEmailAndPassword|createUserWithEmailAndPassword/.test(game + read('learn.js') + read('index.html'))
   && /never create a password/.test(text),
   'C12 "students never create a password" \u2014 only Google sign-in exists');
// ⚠️ THE REGION IS NOT IN THE REPO, SO THIS RESTS ON A HUMAN CHECK: Jake read `nam5`
// (United States multi-region) off the Google Cloud console on 2026-09-24. What the
// harness CAN hold is that both documents say the same thing, and that each records
// where the claim came from.
ok(/database is located in the United States/.test(text) && /United States/.test(sec) && /nam5/.test(sec),
   '⚠️ C13 both documents say the database is in the United States, and SECURITY.md names nam5');
ok(/VERIFIED by Jake, 2026-09-24[\s\S]{0,120}nam5/.test(pol),
   'C13b and the policy records who verified it and when, since no code can');
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

// ⚠️⚠️ FINAL, AT JAKE'S INSTRUCTION — and the consent paragraph is true only once his
// principal has approved. That cannot be checked in code, so it is a NOTE every run.
ok(!/PENDING DISTRICT REVIEW|\bDraft\b/.test(text), 'E1 no draft markers remain');
notes.push('the COPPA section says the school approves TypeThatBook \u2014 publish only after the principal has');
// ⚠️⚠️⚠️ NEVER A CERTIFICATION. The policy DESCRIBES practices. "COPPA compliant" is a
// claim about an outcome no one has verified, and an unverified compliance claim is
// the sentence that turns a practices document into a misrepresentation.
ok(!/COPPA[- ]compliant|compliant with COPPA|COPPA compliance|fully compliant/i.test(text),
   '⚠️⚠️⚠️ E2 the policy never claims to BE compliant \u2014 it describes what the site does');
ok(/Children's privacy \(COPPA\)/.test(text), 'E3 but COPPA is named in a heading a reviewer can find');
for (const n of notes) console.log('  note  ' + n);
console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
