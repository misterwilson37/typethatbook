// site-nav.js v1.2.0 — Round 123 (Maskelyne): ⚠️⚠️ THE SCHOOL MENU IS POSITIONED
// FIXED. Jake: *"the school/school beta dropdown doesn't work from library."* The
// handler fires and the menu opens — it was being clipped or stacked out of sight
// by the host page's header, which an absolutely-positioned child cannot defend
// itself against. See place().
//
// site-nav.js v1.1.0 — Round 122 (Maskelyne): ⭐⭐ THE COMPACT PILL. Jake,
// 2026-09-14: *"The mode pill is huge — and it's not on the pages that have the
// game. They should match in terms of available information and navigation. So
// the easiest thing to do is just remove it from the lessons. But if it were a
// circle that hover would expand to the pill, it could stay and not take up as
// much space."*
// ⚠️⚠️ THE CHOICE BETWEEN HIS TWO OPTIONS IS NOT A STYLE CALL. Deleting the pill
// from the lesson pages makes them match the reader by SUBTRACTING navigation
// from the two pages a student spends the most time on — and Round 116 added this
// file precisely because a page that does not know Arcade exists is a page a
// child cannot leave. ⭐ THE CIRCLE MATCHES THEM BY ADDITION INSTEAD: small
// enough for the reader's crowded bar, so the pill can go on every page and the
// site map is the same everywhere.
// ⚠️ COMPACT IS A SIZE, NEVER A CONTENT DIFFERENCE. The same three tabs, the same
// menu, the same markup — one class, and everything is reachable without it.
//
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

export const SITE_NAV_VERSION = '1.2.0';

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
/* ⭐ IT OVERLAPS WHATEVER IS BELOW — Jake: *"even if it overlaps
   stuff - it's only visible when you click, after all."* Reserving space for a
   menu that is shut 99% of the time would cost every page a band of nothing. */
.ttb-menu {
    /* ⚠️ THE POSITION IS SET IN JS, FROM THE BUTTON'S RECT — see place(). These
       are the fallback coordinates for the one frame before that runs, and
       z-index is high enough to clear a sticky header on any of the four pages. */
    position: fixed; z-index: 3000;
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

/* ═══════════════════════════════════════════════════════════════════════════
   ⭐⭐ COMPACT — A CIRCLE THAT BECOMES THE PILL
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️⚠️ IT COLLAPSES THE TABS THE STUDENT IS NOT ON, AND KEEPS THE ONE THEY ARE.
   A circle showing a generic icon would cost a glance to answer "where am I";
   the current tab's own initial answers it without one, and it is the piece that
   was never navigation to begin with — the current tab is a <span>, not a link.

   ⚠️ TRANSITIONS ON max-width AND padding, NOT ON width. These tabs are laid out
   by their text and have no width to animate; max-width is the property that can
   go from 0 to "enough" without anyone measuring anything.

   ⚠️⚠️ :focus-within IS NOT OPTIONAL — it is the whole keyboard story. Tabbing
   into a pill that only opens on hover would move focus to something invisible,
   which is worse than not having the control. ⭐ AND .ttb-open IS THE TOUCH
   STORY: a tap sets it, because a trackpad-less iPad has no hover at all and
   Jake's students are not all on the same machine.

   ⚠️⚠️⚠️ NO BACKTICKS ANYWHERE IN THIS BLOCK. It is a template literal, and a
   backtick in a comment inside it ENDS THE STRING — the rest of the CSS becomes
   code and the page dies on load. That is not hypothetical: writing this very
   note with the selector name quoted in backticks did exactly that, and
   module-parse-test.mjs caught it in the same minute. It is the defect that
   harness was written for, reproduced by accident, inside the file it was
   written about. */
.ttb-nav.ttb-compact .ttb-tab {
    transition: max-width .18s ease, padding .18s ease, opacity .14s ease;
}
.ttb-nav.ttb-compact .ttb-tab:not(.on) {
    max-width: 0; padding-left: 0; padding-right: 0; opacity: 0; overflow: hidden;
}
.ttb-nav.ttb-compact .ttb-tab.on { padding-left: 11px; padding-right: 11px; }
.ttb-nav.ttb-compact .ttb-tab .ttb-caret { display: none; }
.ttb-nav.ttb-compact .ttb-full { display: none; }
.ttb-nav.ttb-compact .ttb-abbr { display: inline; }
.ttb-nav.ttb-compact:hover .ttb-tab:not(.on),
.ttb-nav.ttb-compact:focus-within .ttb-tab:not(.on),
.ttb-nav.ttb-compact.ttb-open .ttb-tab:not(.on) {
    max-width: 9rem; padding-left: 14px; padding-right: 14px; opacity: 1;
}
.ttb-nav.ttb-compact:hover .ttb-full,
.ttb-nav.ttb-compact:focus-within .ttb-full,
.ttb-nav.ttb-compact.ttb-open .ttb-full { display: inline; }
.ttb-nav.ttb-compact:hover .ttb-abbr,
.ttb-nav.ttb-compact:focus-within .ttb-abbr,
.ttb-nav.ttb-compact.ttb-open .ttb-abbr { display: none; }
.ttb-nav.ttb-compact:hover .ttb-tab .ttb-caret,
.ttb-nav.ttb-compact:focus-within .ttb-tab .ttb-caret,
.ttb-nav.ttb-compact.ttb-open .ttb-tab .ttb-caret { display: inline; }
/* ⚠️ THE COLLAPSED STATE IS ROUND, because a one-letter rounded RECTANGLE reads
   as a clipped word. The pill's own 999px radius does the rest. */
.ttb-nav.ttb-compact .ttb-pill { transition: border-radius .18s ease; }
.ttb-abbr { display: none; font-weight: 700; }
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
 * @param {object} [opts]         `{ compact: true }` collapses it to a circle
 *                                that opens on hover, focus or tap. ⚠️ A SIZE,
 *                                NOT A CONTENT DIFFERENCE — see the CSS block.
 *
 * ⚠️ RETURNS THE NAV ELEMENT so a caller can place it; it does not decide its own
 * position. Every page's header has a different layout and this file has no
 * business knowing about any of them.
 */
export function mountSiteNav(host, current, page, opts) {
    const el = typeof host === 'string' ? document.querySelector(host) : host;
    if (!el) return null;
    injectStyle();

    const compact = !!(opts && opts.compact);
    const nav = document.createElement('div');
    nav.className = 'ttb-nav' + (compact ? ' ttb-compact' : '');
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
            // ⚠️ BOTH SPELLINGS ARE ALWAYS IN THE DOM and CSS picks one. Swapping
            // the text on hover would mean a JS listener per page and a state this
            // file would have to keep; a class does it with neither.
            btn.innerHTML = '<span class="ttb-abbr" aria-hidden="true">' + tab.label[0] + '</span>'
                + '<span class="ttb-full">' + tab.label + '</span>'
                + '<span class="ttb-caret" aria-hidden="true">\u25be</span>';
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

            // ═══════════════════════════════════════════════════════════════
            // ⚠️⚠️ THE MENU IS POSITIONED **FIXED**, FROM THE BUTTON'S RECT.
            // ═══════════════════════════════════════════════════════════════
            //
            // Jake, 2026-09-14: *"The school/school beta dropdown doesn't work
            // from library, though. Clicking doesn't do anything there."*
            //
            // ⚠️⚠️ AND I COULD NOT REPRODUCE IT IN jsdom: the click fires, the
            // handler runs and `menu.hidden` goes false, on the button and on the
            // inner span alike. ⭐ SO THE LOGIC IS NOT THE PROBLEM AND THE MENU IS
            // OPENING — it is not being SEEN. An absolutely-positioned child is at
            // the mercy of every ancestor it has: one `overflow: hidden`, one
            // stacking context from index.html's `position: sticky` header, and it
            // is drawn where nobody can look at it.
            //
            // ⭐⭐ FIXED POSITIONING TAKES THE ANCESTORS OUT OF THE ANSWER. The
            // viewport is the only frame of reference, so no page's header CSS can
            // clip it and no page can stack something above it without saying so
            // in its own z-index. ⚠️ FOUR PAGES MOUNT THIS AND THEY HAVE FOUR
            // DIFFERENT HEADERS; a fix that depended on knowing any of them would
            // be the fifth page's bug.
            //
            // ⚠️ THE COST IS THAT IT DOES NOT FOLLOW THE PAGE. A fixed menu stays
            // put while the document scrolls, so it CLOSES on scroll — which is
            // what a menu should do anyway, and is what every OS does with one.
            const place = () => {
                const r = btn.getBoundingClientRect();
                menu.style.position = 'fixed';
                menu.style.top = (r.bottom + 6) + 'px';
                menu.style.left = Math.max(8, r.left) + 'px';
            };
            const setOpen = (open) => {
                if (open) place();
                menu.hidden = !open;
                btn.setAttribute('aria-expanded', String(open));
            };
            // ⚠️ `capture: true` AND `passive: true` — the scroll may happen on an
            // inner container rather than on the window (index.html's shelf does
            // exactly that), and a listener that never calls preventDefault should
            // say so or it costs scroll performance on every page.
            document.addEventListener('scroll', () => {
                if (!menu.hidden) setOpen(false);
            }, { capture: true, passive: true });
            window.addEventListener('resize', () => { if (!menu.hidden) place(); });
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
        node.innerHTML = '<span class="ttb-abbr" aria-hidden="true">' + tab.label[0] + '</span>'
            + '<span class="ttb-full">' + tab.label + '</span>';
        if (on) node.setAttribute('aria-current', 'page');
        else node.href = tab.href;
        pill.appendChild(node);
    }

    // ⚠️⚠️ THE TAP-TO-OPEN HALF OF COMPACT. Hover is a mouse story and focus is a
    // keyboard one; a touch device has neither until something is pressed. ⭐ It
    // closes on the next click anywhere, like the School menu already does, so
    // there is one dismissal gesture on this control rather than two.
    if (compact) {
        nav.addEventListener('click', (e) => {
            if (nav.classList.contains('ttb-open')) return;
            nav.classList.add('ttb-open');
            e.stopPropagation();
        });
        document.addEventListener('click', () => nav.classList.remove('ttb-open'));
    }

    el.appendChild(nav);
    return nav;
}
