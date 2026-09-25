// Tiny shared test harness: pass/fail counting and source helpers.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
export function check(name, cond, detail = '') {
    if (cond) { passed++; console.log('  ✓', name); }
    else { failed++; console.log('  ✗', name, detail ? `— ${detail}` : ''); }
}
export function section(t) { console.log('\n' + t); }
export function finish(label) {
    console.log(`\n${label}: ${passed} passed, ${failed} failed`);
    if (failed) process.exitCode = 1;
}
export const read = f => readFileSync(join(ROOT, f), 'utf8');
export const rootFiles = ext => readdirSync(ROOT).filter(f => f.endsWith(ext)).sort();
// Strip comments so a warning ABOUT a pattern never counts as the pattern.
export function stripHtmlComments(s) { return s.replace(/<!--[\s\S]*?-->/g, ''); }
export function stripJsComments(s) {
    return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1');
}
export const stripAll = s => stripJsComments(stripHtmlComments(s));
// The nine games — every page that saves a score.
export const GAMES = ['balancedplacement.html', 'balancedplacement2.html', 'findthecenter.html',
    'formatfrenzy.html', 'formattrainer.html', 'perfectalignment.html', 'pictureperfect.html',
    'spottheformat.html', 'sweetspot.html'];
