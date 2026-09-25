// hand-guide-test.mjs v1.0.0 — Round 147.
//
// ⚠️⚠️ THE FINGER GUIDE REACHES EVERY KEY — AND SAYS SO WHEN IT CAN'T.
//
// Jake, 2026-09-25: in standard mode the dash key lit up but its finger circle never
// appeared. From the live console, the dash's right-pinky finger existed and was never
// activated; run here, the same finger map knows the dash. The live cause couldn't be
// seen from the code, so Round 147 added a fallback (use the lit key) and a record of
// every decision (ttbGuide.last()). This harness runs the REAL functions from game.js.

import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const g = readFileSync(path.join(ROOT, 'game.js'), 'utf8');
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) { pass++; console.log('  ok    ' + m); } else { fails.push(m); console.log('  FAIL  ' + m); } };
const ex = (name) => { const s = g.indexOf(`function ${name}(`); if (s < 0) return ''; let d = 0;
    for (let j = g.indexOf('{', s); j < g.length; j++) { if (g[j] === '{') d++; else if (g[j] === '}' && --d === 0) return g.slice(s, j + 1); } };
const block = (start) => { const i = g.indexOf(start); let d = 0;
    for (let j = g.indexOf('{', i); j < g.length; j++) { if (g[j] === '{') d++; else if (g[j] === '}' && --d === 0) return g.slice(i, j + 2); } };
const LAYOUTS_SRC = block('const LAYOUTS = {');
const HG_SRC = g.slice(g.indexOf('const _hg = { last: null'), g.indexOf('window.ttbGuide ='));

console.log('\nA — ⚠️⚠️ EVERY KEY ON EVERY LAYOUT HAS A FINGER');
{
    const r = new Function(`${LAYOUTS_SRC}
        let fingerMap = {}, numRow, numShiftRow, rows, shiftRows;
        ${ex('buildFingerMap')} ${ex('getFingerInfo')}
        const out = {};
        for (const L of Object.keys(LAYOUTS)) {
            ({ numRow, numShiftRow, rows, shiftRows } = LAYOUTS[L]); buildFingerMap();
            const chars = [...numRow, ...numShiftRow, ...rows.flat(), ...shiftRows.flat()];
            out[L] = chars.filter(c => !getFingerInfo(c));
        }
        return out;`)();
    for (const [L, missing] of Object.entries(r)) ok(missing.length === 0, `A1 ${L}: every key reaches a finger${missing.length ? ' \u2014 missing ' + JSON.stringify(missing) : ''}`);
}

console.log('\nB — ⚠️⚠️⚠️ THE REAL GUIDE, IN A PAGE');
const dom = new JSDOM(`<body><div id="virtual-keyboard">
    <div class="key" id="key--" data-char="-" data-shift="_"></div><div class="key" id="key-;" data-char=";" data-shift=":"></div>
    <div class="key" id="key-p" data-char="p" data-shift="P"></div></div>
    <svg id="hg-svg"><g class="hg-finger-group" id="hg-finger-right-pinky"><line class="hg-body"/><circle class="hg-tip"/></g></svg></body>`);
const warns = [];
const run = (fingerMapSeed) => new Function('document', 'window', 'console', `
    let handGuideEnabled = true, fullText = '-', currentCharIndex = 0;
    let fingerMap = ${JSON.stringify(fingerMapSeed)};
    const getHomeKeys = () => ({ 'right-pinky': ';' });
    ${ex('getFingerInfo')} ${ex('getKeyCenterInKB')}
    ${HG_SRC}
    window.ttbGuide = { last: () => _hg.last };
    ${ex('hgFromLitKey')} ${ex('hgLitKeyChars')} ${ex('updateHandGuide')}
    updateHandGuide();
    return _hg.last;`)(dom.window.document, dom.window, { warn: (...a) => warns.push(a.join(' ')), log() {} });
const finger = () => dom.window.document.getElementById('hg-finger-right-pinky');
dom.window.document.getElementById('key--').classList.add('target');
{
    const rec = run({ '-': { finger: 'right-pinky', keyChar: '-' } });
    ok(finger().classList.contains('hg-active') && rec.reason === 'ok' && rec.finger === 'right-pinky',
       'B1 a known dash activates the right pinky, and records "ok"');
    ok(rec.char === '-' && rec.code === 'U+002D', 'B2 the record names the exact character and its code point');
}
{
    finger().classList.remove('hg-active'); warns.length = 0;
    // A character the map doesn't know (say, a stray variant dash) whose LIT KEY it does
    // know through the key's shifted face.
    const doc = dom.window.document;
    const saved = doc.getElementById('key--').dataset.char;
    doc.getElementById('key--').dataset.char = '\u2011';
    const rec = (() => { const r = new Function('document', 'window', 'console', `
        let handGuideEnabled = true, fullText = '\u2011', currentCharIndex = 0;
        let fingerMap = { '_': { finger: 'right-pinky', keyChar: '-', shift: true } };
        const getHomeKeys = () => ({ 'right-pinky': ';' });
        ${ex('getFingerInfo')} ${ex('getKeyCenterInKB')} ${HG_SRC}
        ${ex('hgFromLitKey')} ${ex('hgLitKeyChars')} ${ex('updateHandGuide')}
        updateHandGuide(); return _hg.last;`); return r(doc, dom.window, { warn: (...a) => warns.push(a.join(' ')) }); })();
    doc.getElementById('key--').dataset.char = saved;
    ok(finger().classList.contains('hg-active'),
       '⚠️⚠️ B3 THE FALLBACK: a character the map doesn\u2019t know still moves the finger, via the lit key');
    ok(/used the lit key instead/.test(rec.reason) && rec.litKey === '_', 'B4 and the record says it fell back, and through which face of the key');
    ok(warns.length === 1 && /\[hand guide\]/.test(warns[0]) && /U\+2011/.test(warns[0]),
       '⚠️⚠️ B5 ONE console warning, naming the character by code point');
}
{
    dom.window.document.getElementById('key--').classList.remove('target');
    finger().classList.remove('hg-active'); warns.length = 0;
    const rec = run({});
    ok(!finger().classList.contains('hg-active') && /no lit key to fall back on/.test(rec.reason) && warns.length === 1,
       'B6 with nothing to fall back on, it says exactly that instead of failing silently');
}

console.log('\nC — NO SILENT EXITS');
{
    const f = ex('updateHandGuide');
    // From the first real decision onward — the reset loop's `return` skips one finger,
    // it doesn't leave the function.
    const after = f.slice(f.indexOf('    if (!info) {'));
    const silent = [...after.matchAll(/return;/g)].filter(m => !/hgNote\(rec\);\s*(\}\s*)?$/.test(after.slice(Math.max(0, m.index - 60), m.index).trimEnd())
                                                     && !/'thumb'/.test(after.slice(Math.max(0, m.index - 200), m.index)));
    ok(silent.length === 0, `C1 every exit after the character is known records why (${silent.length} silent)`);
    ok(/window\.ttbGuide = \{ last: \(\) => _hg\.last/.test(g), 'C2 ttbGuide.last() is available in the console');
}

console.log(fails.length ? `\nFAIL — ${pass} ok, ${fails.length} failed` : `\nPASS — ${pass} ok, 0 failed`);
if (fails.length) process.exitCode = 1;
