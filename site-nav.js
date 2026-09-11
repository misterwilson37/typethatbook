// site-nav.js v1.0.0 — THE MODE PILL, ONCE. Round 116 (Sun).
//
// ⭐⭐ ONE RECORD OF WHERE A STUDENT CAN GO. Round 116 gave arcade.html a
// three-way School / Library / Arcade pill and left index.html and learn.html
// showing two-way ones, so the arcade became the only page in TTB that knew all
// three places existed. ⚠️⚠️ FOUR HAND-COPIED PILLS WOULD BE FOUR RECORDS OF THE
// SITE MAP, and the fifth page — or the day Arcade gets renamed — is when they
// would start disagreeing. This app has no build step and no partials; a module
// that paints itself is the only mechanism available.
//
// ⭐ AND THE SCHOOL TAB IS A MENU, because there are two School pages. Jake,
// 2026-09-11: *"if there's a way to make it so that when you click on school, it
// offers either learn or learn2 (like the beta drops below it, even if it
// overlaps stuff - it's only visible when you click, after all)."*
//
// ⚠️⚠️ THAT MENU IS A SYMPTOM AND SHOULD NOT OUTLIVE ITS CAUSE. `learn2` is an
// unreconciled fork — HANDOFF's open item 1, first on the list since Round 102,
// and the School Beta card already sends real students to it. This file makes
// the fork VISIBLE rather than resolving it. ⭐ WHEN THE FORK IS RECONCILED,
// DELETE `SCHOOL_PAGES[1]` AND THE MENU COLLAPSES BACK TO A PLAIN TAB ON ITS
// OWN — one line, and the pill on every page follows.
//
// ⚠️ IT STYLES ITSELF, ONCE, INTO THE DOCUMENT. Four pages with four copies of
// the CSS is the same defect as four copies of the markup, and three of the four
// pages here have different palettes — so the colours come from CSS custom
// properties with per-page fallbacks rather than from literals.

export const SITE_NAV_VERSION = '1.0.0';

/**
 * ⚠️ ORDER IS THE SITE MAP AND IT IS DELIBERATE: School first because it is what
 * a student is sent here to do, Library second, Arcade last because it is the
 * reward. ⭐ The arcade's own header put navigation on the LEFT for the same
 * reason — this is the page a child arrives at by accident more than any other.
 */
const TABS = [
    { id: 'school', label: 'School' },
    { id: 'library', label: 'Library', href: './index.html' },
    { id: 'arcade', label: 'Arcade', href: './arcade.html' },
];

/**
 * ⚠️⚠️ THE TWO SCHOOL PAGES, AND THE SECOND ONE IS A FORK THAT SHOULD NOT EXIST.
 * See the header. `note` is shown under the label so a student is told what they
 * are choosing rather than being asked to know what "learn2" means.
 */
const SCHOOL_PAGES = [
    { href: './learn.html', label: 'Lessons', note: 'the usual one' },
    { href: './learn2.html', label: 'Lessons (beta)', note: 'newer, still changing' },
];

const CSS = `
.ttb-nav { position: relative; display: inline-flex; align-items: center; }
.ttb-pill {
    display: inline-flex; border-radius: 999px; overflow: hidden; flex-shrink: 0;
    border: 1px solid var(--ttb-nav-rule, #3a3a3a);
    background: var(--ttb-nav-bg, #141414);
}
.ttb-tab {
    font: inherit; font-size: .78rem; letter-spacing: .5px; padding: 5px 14px;
    border: 0; background: transparent; cursor: pointer; line-height: 1.6;
    white-space: nowrap; text-decoration: none;
    color: var(--ttb-nav-ink, #8a8a8a);
    transition: background .15s, color .15s;
}
.ttb-tab:hover { color: var(--ttb-nav-hover, #e6e6e6); background: var(--ttb-nav-bg-hover, #1e1e1e); }
.ttb-tab.on {
    background: var(--ttb-nav-accent, #4B9CD3);
    color: var(--ttb-nav-on-accent, #08121a); font-weight: 700;
}
.ttb-tab.on:hover { background: var(--ttb-nav-accent, #4B9CD3); color: var(--ttb-nav-on-accent, #08121a); }
/* ⚠️ THE CARET IS PART OF THE TAB, NOT A SECOND CONTROL. A separate arrow button
   beside "School" gives a child two targets for one decision. */
.ttb-tab .ttb-caret { font-size: .62em; margin-left: 6px; opacity: .8; }
/* ⭐ ABSOLUTE, SO IT OVERLAPS WHATEVER IS BELOW — Jake: *"even if it overlaps
   stuff - it's only visible when you click, after all."* Reserving space for a
   menu that is shut 99% of the time would cost every page a band of nothing. */
.ttb-menu {
    position: absolute; top: calc(100% + 6px); left: 0; z-index: 300;
    min-width: 190px; padding: 5px;
    border-radius: 8px;
    border: 1px solid var(--ttb-nav-rule, #3a3a3a);
    background: var(--ttb-nav-menu-bg, #1a1a1a);
    box-shadow: 0 14px 34px rgba(0,0,0,.5);
}
.ttb-menu[hidden] { display: none; }
.ttb-item {
    display: block; padding: 8px 10px; border-radius: 5px;
    text-decoration: none; color: var(--ttb-nav-hover, #e6e6e6);
    font-size: .82rem; line-height: 1.3;
}
.ttb-item:hover, .ttb-item:focus-visible { background: var(--ttb-nav-bg-hover, #1e1e1e); }
.ttb-item b { font-weight: 700; display: block; }
.ttb-item i { font-style: normal; font-size: .72rem; opacity: .62; }
.ttb-item.on b { color: var(--ttb-nav-accent, #4B9CD3); }
@media (max-width: 520px) { .ttb-tab { padding: 5px 9px; font-size: .72rem; } }
`;

let styled = false;
function injectStyle() {
    if (styled || document.getElementById('ttb-nav-style')) { styled = true; return; }
    const el = document.createElement('style');
    el.id = 'ttb-nav-style';
    el.textContent = CSS;
    document.head.appendChild(el);
    styled = true;
}

/**
 * Paint the pill into `host`.
 *
 * @param {Element|string} host   element or selector
 * @param {string} current        'school' | 'library' | 'arcade'
 * @param {string} [page]         which School page, when current is 'school':
 *                                'learn' | 'learn2'. Only marks the menu item.
 *
 * ⚠️ RETURNS THE NAV ELEMENT so a caller can place it; it does not decide its own
 * position. Every page's header has a different layout and this file has no
 * business knowing about any of them.
 */
export function mountSiteNav(host, current, page) {
    const el = typeof host === 'string' ? document.querySelector(host) : host;
    if (!el) return null;
    injectStyle();

    const nav = document.createElement('div');
    nav.className = 'ttb-nav';
    const pill = document.createElement('div');
    pill.className = 'ttb-pill';
    nav.appendChild(pill);

    let menu = null;

    for (const tab of TABS) {
        const on = tab.id === current;
        if (tab.id === 'school') {
            // ⚠️ A BUTTON, NOT A LINK, because it opens a menu rather than going
            // anywhere. A link that does not navigate is a lie to a screen reader
            // and to anyone who middle-clicks it.
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ttb-tab' + (on ? ' on' : '');
            btn.innerHTML = tab.label + '<span class="ttb-caret" aria-hidden="true">\u25be</span>';
            btn.setAttribute('aria-haspopup', 'true');
            btn.setAttribute('aria-expanded', 'false');
            if (on) btn.setAttribute('aria-current', 'page');
            pill.appendChild(btn);

            menu = document.createElement('div');
            menu.className = 'ttb-menu';
            menu.hidden = true;
            for (const p of SCHOOL_PAGES) {
                const a = document.createElement('a');
                a.className = 'ttb-item';
                const isHere = on && page && p.href.includes(page + '.html');
                if (isHere) a.classList.add('on');
                a.href = p.href;
                a.innerHTML = `<b>${p.label}</b><i>${p.note}</i>`;
                menu.appendChild(a);
            }
            nav.appendChild(menu);

            const setOpen = (open) => {
                menu.hidden = !open;
                btn.setAttribute('aria-expanded', String(open));
            };
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                setOpen(menu.hidden);
            });
            // ⚠️ CLOSES ON OUTSIDE CLICK AND ON ESCAPE. A menu that can only be
            // dismissed by choosing something is a trap, and Escape already means
            // "never mind" everywhere else in this app.
            document.addEventListener('click', () => setOpen(false));
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); }
            });
            continue;
        }
        // ⚠️ THE CURRENT PAGE IS A SPAN, NOT A LINK TO ITSELF.
        const node = document.createElement(on ? 'span' : 'a');
        node.className = 'ttb-tab' + (on ? ' on' : '');
        node.textContent = tab.label;
        if (on) node.setAttribute('aria-current', 'page');
        else node.href = tab.href;
        pill.appendChild(node);
    }

    el.appendChild(nav);
    return nav;
}
