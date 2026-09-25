// self-hosted-assets-test.mjs — the policy says no outside company is contacted for
// fonts or page styles. Checks every page's external loads, that every font file
// exists, and that tailwind.css is an up-to-date build.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { check, section, finish, read, rootFiles, stripHtmlComments, ROOT } from './harness.mjs';
import { buildCss, OUT } from './build-css.mjs';

const ALLOWED = [/^https:\/\/www\.gstatic\.com\/firebasejs\/11\.6\.1\/firebase-(app|auth|firestore|storage)\.js$/];

section('External loads: only the Firebase SDK');
for (const f of [...rootFiles('.html'), ...rootFiles('.js'), ...rootFiles('.css')]) {
    const s = stripHtmlComments(read(f));
    const urls = [
        ...[...s.matchAll(/<(?:script|link|img|iframe)[^>]*\s(?:src|href)="(https?:[^"]+)"/g)].map(m => m[1]),
        ...[...s.matchAll(/(?:import|from)\s*["'](https?:[^"']+)["']/g)].map(m => m[1]),
        ...[...s.matchAll(/@import\s+url\(["']?(https?:[^)"']+)/g)].map(m => m[1]),
    ];
    const bad = urls.filter(u => !ALLOWED.some(a => a.test(u)));
    check(`${f}: ${urls.length} external load(s), all Firebase SDK`, bad.length === 0, bad.join(', '));
}

section('Fonts are self-hosted');
const fontsCss = read('fonts/fonts.css');
const urls = [...fontsCss.matchAll(/url\('([^']+)'\)/g)].map(m => m[1]);
check('fonts.css declares 11 faces', urls.length === 11, urls.length);
for (const u of urls) check(`fonts/${u} exists`, existsSync(join(ROOT, 'fonts', u)));
for (const fam of ['Inter', 'Urbanist', 'Questrial']) {
    check(`${fam} declared`, fontsCss.includes(`font-family: '${fam}'`));
    check(`${fam} licence present`, existsSync(join(ROOT, 'fonts', `LICENSE-${fam}.txt`)));
}
// Every page, including formattrainer.html (which never loaded a web font until v0.11.1).
for (const f of rootFiles('.html')) {
    check(`${f}: links fonts/fonts.css`, /href="fonts\/fonts\.css"/.test(stripHtmlComments(read(f))));
}

section('Tailwind is a local, up-to-date build');
const TW_PAGES = ['admin.html', 'balancedplacement.html', 'findthecenter.html', 'formatfrenzy.html',
    'index.html', 'leaderboard.html', 'perfectalignment.html', 'spottheformat.html', 'sweetspot.html'];
for (const f of TW_PAGES) {
    const s = stripHtmlComments(read(f));
    const head = s.slice(0, s.indexOf('</head>'));
    check(`${f}: tailwind.css is the LAST stylesheet in <head> (CDN cascade order)`,
          /<link rel="stylesheet" href="tailwind\.css">\s*$/.test(head));
}
const fresh = buildCss();
check('tailwind.css matches a fresh build (rebuild: npm run build:css)', fresh === readFileSync(OUT, 'utf8'));

finish('self-hosted-assets-test');
