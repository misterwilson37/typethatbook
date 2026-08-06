// credits-scroll-test.mjs v1.0.0 — Round 6 (Noiseless).
//
// Adventure's end-of-book credits are canvas animation, and two previous rounds
// declined to build them because nobody in a session like this can watch them run.
// That reasoning covers APPEARANCE. It does not cover POSITION OVER TIME, which is
// arithmetic — the same distinction the condensed chapter map turned up in v1.3.0,
// where a bug had survived precisely because "you can't test canvas" was accepted.
//
// So adventure-renderer.js keeps the reel's geometry in three pure exported
// functions and this file asserts them. What remains unverified is genuinely only
// the look: fonts, colours, whether the parchment wash sits well over the terrain.
// Jake has to eyeball that once. Everything below he does not.
//
//   node credits-scroll-test.mjs
//
// The invariants that matter, and why each one is a bug if it breaks:
//   · nothing is visible at t=0            — credits must rise INTO view, not pop in
//   · motion is monotonic                  — a reel that jitters backwards looks broken
//   · it HOLDS and never scrolls away      — a student looking up late must still
//                                            find the attribution on screen. This is
//                                            the whole point: the books are
//                                            CC-licensed and credit is a licence term
//   · every row becomes visible            — a skipped row is an uncredited contributor
//   · the last row rests on screen         — where the licence and chapter count are
//   · no row exceeds the wrap width        — canvas does not clip, it overflows
//   · a book with no metadata still works  — says so in words, renders no "undefined"
import assert from 'assert';
import { creditsContent, layoutCredits, creditsScroll } from './adventure-renderer.js';

// Deterministic stand-in for ctx.measureText: 0.55em average glyph width. The real
// renderer passes a ctx-backed measurer. Using a fake here is the point — the
// geometry must be correct for ANY plausible metrics, not just one font's.
const measure = (text, size) => text.length * size * 0.55;

let fails = 0;
function ok(label, cond, extra) {
    if (cond) { console.log('   ok   ' + label); return; }
    fails++;
    console.log('   FAIL ' + label + (extra ? '\n          ' + extra : ''));
}

// Real shapes, including the ones that have caused trouble elsewhere in this repo.
const BOOKS = {
    'fully credited': {
        title: 'The Count of Monte Cristo', author: 'Alexandre Dumas',
        source: 'Standard Ebooks', rights: 'CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/',
        cleanedBy: 'Jake', chapters: 117,
    },
    'no metadata at all': {},
    'title only': { title: 'Aesop\u2019s Fables', chapters: 284 },
    'long everything (wrap stress)': {
        title: 'A Considerably Longer Title Than Any Reasonable Book Would Actually Carry In Practice',
        author: 'Someone With A Very Long Name Indeed And Several Middle Initials',
        source: 'Project Gutenberg',
        rights: 'Public domain in the United States https://www.gutenberg.org/policy/permission.html',
        cleanedBy: 'A Volunteer', chapters: 41,
    },
};

const VIEWPORTS = [
    ['iPad portrait-ish', 520],
    ['short laptop pane', 300],
    ['tall desktop',      900],
];

for (const [bookName, detail] of Object.entries(BOOKS)) {
    console.log(`\n### ${bookName}`);
    const rows = creditsContent(detail);

    ok('renders "THE END" first', rows[0] && rows[0].kind === 'end' && rows[0].text === 'THE END');
    ok('never emits the string "undefined" or "null"',
       !rows.some(r => /\b(undefined|null)\b/.test(r.text)),
       JSON.stringify(rows.map(r => r.text)));
    ok('a title row always exists', rows.some(r => r.kind === 'title' && r.text.trim() !== ''));

    if (!Object.keys(detail).length) {
        ok('bare book says so in words rather than showing an empty reel',
           rows.some(r => r.kind === 'none'));
    }
    if (detail.author) {
        ok('author is credited', rows.some(r => r.kind === 'value' && r.text === detail.author));
    }
    if (detail.rights) {
        ok('licence is credited in full (a URI is what CC asks for)',
           rows.filter(r => r.kind === 'value').map(r => r.text).join(' ').includes('creativecommons.org') ||
           rows.filter(r => r.kind === 'value').map(r => r.text).join(' ').includes('gutenberg.org'));
    }

    for (const [vpName, viewH] of VIEWPORTS) {
        const maxWidth = 420;
        const { rows: laid, contentH } = layoutCredits(rows, { maxWidth, measure });

        ok(`[${vpName}] no row exceeds the wrap width`,
           laid.every(r => measure(r.text, r.size) <= maxWidth + 0.001 || !r.text.includes(' ')),
           laid.filter(r => measure(r.text, r.size) > maxWidth && r.text.includes(' '))
               .map(r => r.text).join(' | '));

        ok(`[${vpName}] rows stack downward, never overlapping backwards`,
           laid.every((r, i) => i === 0 || r.y >= laid[i - 1].y));

        const t0 = creditsScroll(0, contentH, viewH);
        ok(`[${vpName}] nothing on screen at t=0`, t0.y >= viewH - 0.001,
           `content top starts at y=${t0.y.toFixed(1)}, viewport is ${viewH}`);

        // Sample the whole reel plus a generous tail.
        const end = t0.durationMs;
        const samples = [];
        for (let t = 0; t <= end + 20000; t += 100) samples.push(creditsScroll(t, contentH, viewH));

        ok(`[${vpName}] motion is monotonic (never jitters backwards)`,
           samples.every((s, i) => i === 0 || s.y <= samples[i - 1].y + 1e-9));

        ok(`[${vpName}] settles and HOLDS — never scrolls off forever`,
           samples[samples.length - 1].y === t0.restY && samples[samples.length - 1].done,
           `ended at y=${samples[samples.length - 1].y.toFixed(1)}, restY=${t0.restY.toFixed(1)}`);

        // Every row must be fully on screen at some sampled moment.
        const unseen = laid.filter(r =>
            !samples.some(s => (s.y + r.y) >= 0 && (s.y + r.y + r.size) <= viewH));
        ok(`[${vpName}] every row becomes fully visible at some point`,
           unseen.length === 0,
           unseen.length ? 'never fully shown: ' + unseen.map(r => JSON.stringify(r.text)).join(', ') : '');

        // At rest, the tail — licence, chapter count — must be readable.
        const last = laid[laid.length - 1];
        const lastYAtRest = t0.restY + last.y;
        ok(`[${vpName}] the LAST row rests on screen`,
           lastYAtRest >= 0 && lastYAtRest + last.size <= viewH,
           `last row "${last.text}" rests at y=${lastYAtRest.toFixed(1)} in a ${viewH}px view`);

        ok(`[${vpName}] the reel is watchable, not a blink or a sit-in (4s..3min)`,
           end >= 4000 && end <= 180000, `duration ${(end / 1000).toFixed(1)}s`);
    }
}

// ── Degenerate inputs: these must not throw, divide by zero, or loop ──────────
console.log('\n### degenerate inputs');
for (const [label, detail] of [
    ['null detail',            null],
    ['undefined detail',       undefined],
    ['numeric title',          { title: 12345 }],
    ['whitespace-only author', { title: 'X', author: '   ' }],
    ['chapters as a string',   { title: 'X', chapters: '41' }],
    ['negative chapters',      { title: 'X', chapters: -3 }],
    ['NaN chapters',           { title: 'X', chapters: NaN }],
    ['one unbreakable word',   { title: 'X', rights: 'https://example.test/' + 'a'.repeat(400) }],
]) {
    try {
        const rows = creditsContent(detail);
        const { contentH } = layoutCredits(rows, { maxWidth: 300, measure });
        const s = creditsScroll(1000, contentH, 400);
        ok(label + ' survives', Number.isFinite(contentH) && Number.isFinite(s.y) && contentH > 0);
    } catch (e) {
        ok(label + ' survives', false, e.message);
    }
}

ok('whitespace-only fields are dropped, not credited as blank',
   !creditsContent({ title: 'X', author: '   ' }).some(r => r.kind === 'label' && r.text === 'BY'));
ok('a bad chapter count is omitted rather than shown',
   !creditsContent({ title: 'X', chapters: -3 }).some(r => r.text === 'CHAPTERS TYPED'));
ok('negative elapsed time is clamped (clock skew / tab restore)',
   creditsScroll(-5000, 500, 400).y === 400);

console.log('');
if (fails) {
    console.log(`${fails} FAILURE(S) in the credits reel geometry.`);
    process.exitCode = 1;
} else {
    console.log('ALL PASS — the reel rises into view, moves forward, shows every row,');
    console.log('and holds the attribution on screen at every book size and viewport tested.');
    console.log('NOT covered here: how it LOOKS. Someone has to finish a book and see it once.');
}
