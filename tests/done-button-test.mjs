// done-button-test.mjs v1.0.0 — "I'M DONE" IS A RECEIPT, NOT A SAVE BUTTON.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS PROTECTS
// ═══════════════════════════════════════════════════════════════════════════
//
// The flush happens anyway — on the interval, on `pagehide`, on sign-out. A child
// who never presses this loses NOTHING, and every assertion here exists to keep
// that true against the most natural "improvement" anyone would make to it.
//
// ⚠️ THE FAILURE MODE IS NOT A CRASH. It is a button that slowly becomes load
// bearing: relabelled "Save", given a confirm-on-exit, made the primary action,
// or wired into a code path that gates on it. Then the quiet child who packs up
// when the bell rings loses minutes, and a grade depends on a ritual. None of
// those changes would break a test that only checked that the flush fires — so
// this file checks the wording and the shape too, which is unusual and
// deliberate.
//
// PARTS
//   A — both writers file the open sprint/run AND take a final flush, in that
//       order. Backwards and the sprint's seconds miss the write.
//   B — ⚠️ THE BUTTON IS NEVER LOAD-BEARING: no "Save" label, no confirm, no
//       warning, and the other exits survive untouched.
//   C — re-entrancy: twelve-year-olds double-click, and a doubled run would file
//       the open sprint twice — §6 item 8's duplicate rollup, manufactured.
//   D — a failed read still shows the card. The flush already happened; showing
//       nothing reads as "it didn't work", the one message this must not send.
//   E — receipt.js is shared, state-free, and uses hud.js's fmt() rather than a
//       fifth copy of the formatting.
//   F — markup: tabindex="-1" (item 8's Tab hazard), inside #user-info so guests
//       never see it, and both HUD blocks still balance their divs.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + msg); } };

const src = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');

const WRITERS = [
    { f: 'game.js',  close: 'logOpenSprint', flush: 'flushAll' },
    { f: 'learn.js', close: 'logOpenRun',    flush: 'flushStats' },
];

console.log('\n─── A. close the open unit, THEN flush ───');
for (const w of WRITERS) {
    const body = decomment(src(w.f));
    const fn = body.slice(body.indexOf('async function handleImDone'));
    const scope = fn.slice(0, 2200);
    ok(/async function handleImDone/.test(body), `A1 ${w.f}: the handler exists`);
    const iClose = scope.indexOf(w.close + "('done')");
    const iFlush = scope.indexOf(w.flush + "('done', true)");
    ok(iClose > 0, `A2 ${w.f}: files the open unit via ${w.close}('done')`);
    ok(iFlush > 0, `A3 ⚠️ ${w.f}: takes a FINAL flush — ${w.flush}('done', true)`);
    // ⚠️ ORDER IS THE ASSERTION. Flush first and the sprint in progress has not
    // been turned into a session record yet, so the write goes out without it.
    ok(iClose >= 0 && iFlush > iClose,
       `A4 ⚠️ ${w.f}: the close comes BEFORE the flush`);
    ok(/await\s+\w+\('done', true\)/.test(scope),
       `A5 ${w.f}: the flush is awaited before the card is drawn`);
}

console.log('\n─── B. ⚠️ NEVER LOAD-BEARING ───');
{
    for (const f of ['game.html', 'learn.html']) {
        const html = src(f);
        const btn = html.slice(html.indexOf('id="done-btn"') - 200,
                               html.indexOf('id="done-btn"') + 320);
        ok(/I'm done/.test(btn), `B1 ${f}: the label is "I'm done"`);
        // ⚠️ THE LABEL IS THE SAFEGUARD. "Save" implies the alternative is losing
        // it, which is exactly the belief this button must never create.
        ok(!/>\s*Save\s*</.test(btn), `B2 ⚠️ ${f}: the label is NOT "Save"`);
        // The other exits must survive. This is never the only way out.
        ok(/id="logout-btn"/.test(html), `B3 ${f}: (Logout) still exists`);
        ok(/id="hud-back-link"|id="back-btn"/.test(html), `B4 ⚠️ ${f}: the back link still exists`);
    }
    for (const w of WRITERS) {
        const body = decomment(src(w.f));
        const fn = body.slice(body.indexOf('async function handleImDone'), 
                              body.indexOf('async function handleImDone') + 2200);
        // ⚠️ NO NAGGING ON THE WAY OUT. A confirm() or beforeunload prompt asking
        // "are you sure, you haven't pressed I'm done?" would convert a receipt
        // into a requirement in one line.
        ok(!/confirm\(/.test(fn), `B5 ⚠️ ${w.f}: no confirm() in the handler`);
        ok(!/beforeunload/.test(fn), `B6 ⚠️ ${w.f}: the handler adds no unload prompt`);
        // Nothing else in the file may branch on whether it was pressed.
        ok(!/_doneInFlight\s*\)\s*\{[\s\S]{0,80}return\s*;[\s\S]{0,80}\}/.test(
             body.replace(/async function handleImDone[\s\S]{0,2200}/, '')),
           `B7 ${w.f}: no code outside the handler gates on the button`);
    }
}

console.log('\n─── C. re-entrancy ───');
for (const w of WRITERS) {
    const body = decomment(src(w.f));
    ok(/let _doneInFlight = false;/.test(body), `C1 ${w.f}: an in-flight guard exists`);
    const fn = body.slice(body.indexOf('async function handleImDone'),
                          body.indexOf('async function handleImDone') + 2200);
    ok(/if \(_doneInFlight\) return;/.test(fn),
       `C2 ⚠️ ${w.f}: a second click returns early — a doubled run files the sprint twice`);
    ok(/finally\s*\{[\s\S]{0,220}_doneInFlight = false/.test(fn),
       `C3 ⚠️ ${w.f}: the guard is released in a finally — a throw must not wedge the button shut`);
}

console.log('\n─── D. a failed read still shows the card ───');
for (const w of WRITERS) {
    const body = decomment(src(w.f));
    const fn = body.slice(body.indexOf('async function handleImDone'),
                          body.indexOf('async function handleImDone') + 2200);
    ok((fn.match(/showReceipt\(/g) || []).length >= 2,
       `D1 ⚠️ ${w.f}: the card is drawn on the failure path too`);
    ok(/catch\s*\([\s\S]{0,40}\)\s*\{[\s\S]{0,400}showReceipt\(/.test(fn),
       `D2 ${w.f}: a thrown read still ends in a card, marked short`);
    ok(/readWeek\(/.test(fn), `D3 ${w.f}: the week comes from daylog.js, not a fresh copy`);
}

console.log('\n─── E. receipt.js is shared and state-free ───');
{
    const r = src('receipt.js');
    const rb = decomment(r);
    ok(/export function showReceipt/.test(rb), 'E1 one exported entry point');
    // ⚠️ THE FIFTH SURFACE ONTO hud.js's fmt(). A receipt reading "12m 30s"
    // beside a HUD reading "12:30" is two renderings of one number.
    ok(/import \{ fmt \} from ["'.\/]*hud\.js["']/.test(rb),
       'E2 ⚠️ formatting comes from hud.js, not a fifth copy');
    ok(!/function fmt\s*\(/.test(rb), 'E3 and it defines no fmt() of its own');
    // Same contract as celebrate.js: it draws, it does not decide.
    ok(!/firebase|getDoc|firestore/i.test(rb), 'E4 ⚠️ it never touches Firestore');
    ok(!/flush/i.test(rb), 'E5 ⚠️ it never flushes');
    // ⚠️ THE UTC OFF-BY-ONE. `new Date('2026-08-21')` parses as UTC and lands on
    // the previous evening in every US timezone. This project has fixed that
    // more than once elsewhere.
    ok(/localDateOf/.test(rb), 'E6 ⚠️ dates are parsed LOCALLY, not as UTC');
    ok(!/new Date\(dateStr\)/.test(rb), 'E7 no bare new Date(dateStr)');
    // A modal a twelve-year-old cannot dismiss during class is worse than none.
    ok(/Escape/.test(rb), 'E8 ⚠️ Esc dismisses');
    ok(/backdrop\.onclick/.test(rb), 'E9 the backdrop dismisses');
    ok(/close\.onclick/.test(rb), 'E10 the Close button dismisses');
    ok(/removeEventListener\('keydown'/.test(rb),
       'E11 ⚠️ the key listener is removed on dismiss — it is capture-phase and would eat Esc forever');
}

console.log('\n─── F. markup ───');
for (const f of ['game.html', 'learn.html']) {
    const html = src(f);
    const i = html.indexOf('id="done-btn"');
    ok(i > 0, `F1 ${f}: the button exists`);
    const btn = html.slice(i, i + 260);
    // ⚠️ ROADMAP item 8's ruling. A control reachable by Tab from a typing view
    // eats a keystroke the child should have been credited for.
    ok(/tabindex="-1"/.test(btn), `F2 ⚠️ ${f}: tabindex="-1" — Tab must never reach it`);
    // Guests have no week to read and nothing to flush.
    const ui = html.indexOf('id="user-info"');
    const lo = html.indexOf('id="logout-btn"');
    ok(ui > 0 && i > ui && i < lo,
       `F3 ⚠️ ${f}: it sits inside #user-info, before (Logout) — hidden for guests`);
    // The check that would have caught round 26b's stray tag.
    const block = html.slice(html.indexOf('<div id="hud">'), html.indexOf('<div id="caps-warning"'));
    ok(block.split('<div').length === block.split('</div>').length,
       `F4 ⚠️ ${f}: the HUD block's divs balance`);
}

console.log(`\n${fail ? 'FAILED' : 'PASSED'} — ${pass} passing, ${fail} failing`);
process.exit(fail ? 1 : 0);
