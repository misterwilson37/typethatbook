// Rebuilds ../tailwind.css. Run: npm run build:css   (tests/self-hosted-assets-test.mjs
// calls buildCss() and fails if the shipped file differs from a fresh build.)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const OUT = join(HERE, '..', 'tailwind.css');
const HEADER = `/* tailwind.css — SpotOn. BUILT FILE, do not hand-edit.
 * Replaces the Tailwind CDN script (an outside company contacted on every page load,
 * and a script Tailwind says is not for production). tailwindcss 3.4.17, default
 * config (same as the CDN), content = every *.html and *.js in the repo root, so it
 * contains only the classes the pages use.
 * A NEW Tailwind class added to any page will NOT work until this file is rebuilt:
 *   cd tests && npm i && npm run build:css
 * tests/self-hosted-assets-test.mjs rebuilds it and fails if this copy is stale.
 */
`;
export function buildCss() {
    const tmp = join(mkdtempSync(join(tmpdir(), 'tw-')), 'out.css');
    execFileSync(join(HERE, 'node_modules', '.bin', 'tailwindcss'),
        ['-c', join(HERE, 'tailwind.config.cjs'), '-i', join(HERE, 'tailwind.in.css'), '-o', tmp, '--minify'],
        { stdio: 'pipe' });
    return HEADER + readFileSync(tmp, 'utf8');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    writeFileSync(OUT, buildCss());
    console.log('wrote', OUT);
}
