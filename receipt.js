// receipt.js v1.1.0 — "I'M DONE": THE STAMPED CARD.
//
// v1.1.0 — ⚠️ A VERSION CONSTANT, WHICH THIS MODULE SHIPPED WITHOUT.
//          It was extracted as a shared module and never wired into the
//          machinery that maintains shared modules, so versions.js could not
//          report it and the build footer could not see it — a stale cached
//          copy in a classroom was invisible from the chair. ROADMAP 9b;
//          HANDOFF §0.-15. No behaviour changed.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ THIS IS A RECEIPT. IT IS NOT A SAVE BUTTON, AND THE DIFFERENCE IS THE
//    WHOLE DESIGN.
// ═════════════════════════════════════════════════════════════════════════════
//
// The flush happens anyway — on the interval, on `pagehide`, on sign-out. A
// child who never presses this loses NOTHING. What they lacked was any way to
// know their minutes had landed, at a moment they chose.
//
// ⚠️ SO IT MUST NEVER BECOME "SAVE OR LOSE IT." The moment a child believes
// unpressed means unsaved, the quiet one who packs up when the bell rings loses
// minutes and a grade starts depending on a ritual. Rules, all load-bearing:
//
//   • NEVER label it "Save". Jake chose "I'm done" — a child ANNOUNCING
//     something, not performing a chore.
//   • NEVER warn, nag, or confirm on the way out for skipping it.
//   • NEVER make it the only exit. ← Library and (Logout) stay exactly where
//     they are.
//   • NEVER block or gate anything on it. It reads and it draws; that is all.
//
// WHAT IT ACTUALLY BUYS, beyond the reassurance:
//
//   1. ⚠️ IT MANUFACTURES THE DELIBERATE EXIT §3.1 SAYS DOES NOT EXIST — "a
//      `final` flush needs a deliberate exit and a child closing a Chromebook
//      lid produces none." It does NOT fix the unflushed-tail gap; it gives
//      every child a way not to be in it.
//   2. It CLOSES THE OPEN SPRINT, so the drill-down matches the day total
//      instead of dropping the tail under the five-second floor. That tightens
//      ROADMAP item 5's `log ÷ sessions` yardstick directly.
//   3. The receipt is a WEEK of receipts. A child can see their own five days
//      without a teacher pulling a report — Rule 11 (same number, student and
//      teacher) turning into a feature instead of a constraint.
//
// ⚠️ THE THEME IS A LIBRARY DATE-DUE CARD, NOT A FLOPPY DISC. A disc is the
// universal save icon and it is the one thing in this app that is not OF this
// app. You return a book, the card gets stamped, the stamp is your proof.
//
// ⚠️ DOM-ONLY AND STATE-FREE, same contract as celebrate.js. It is handed a week
// that has already been read and it draws it. It does not read Firestore, does
// not flush, and does not decide anything. The callers own all of that.

import { fmt } from "./hud.js";

// ⚠️ fmt() COMES FROM hud.js AND MUST KEEP COMING FROM THERE. A receipt showing
// "12m 30s" beside a HUD showing "12:30" is two renderings of one number, which
// is the drift hud.js was extracted to stop. Four surfaces already share it;
// this is the fifth.

const WEEKDAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH   = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// 'YYYY-MM-DD' → a LOCAL date. ⚠️ NOT `new Date(str)`, which parses a bare date
// string as UTC and lands on the previous evening in every US timezone — the
// same off-by-one-day this project has fixed more than once elsewhere.
function localDateOf(dateStr) {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function labelFor(dateStr) {
    const d = localDateOf(dateStr);
    return { dow: WEEKDAY[d.getDay()], stamp: MONTH[d.getMonth()] + ' ' + d.getDate() };
}

function injectStyles() {
    if (document.getElementById('ttb-receipt-styles')) return;
    const s = document.createElement('style');
    s.id = 'ttb-receipt-styles';
    s.textContent = `
    #ttb-receipt-backdrop {
        position: fixed; inset: 0; z-index: 10050;
        background: rgba(0,0,0,0.62);
        display: flex; align-items: center; justify-content: center;
        animation: ttbReceiptFade 0.25s ease-out;
    }
    @keyframes ttbReceiptFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ttbCardIn {
        from { opacity: 0; transform: translateY(18px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    /* The stamp lands a beat AFTER the card, because that is the whole gesture:
       the card arrives, then it gets stamped. */
    @keyframes ttbStampDown {
        0%   { opacity: 0; transform: rotate(-3deg) scale(2.4); }
        60%  { opacity: 1; transform: rotate(-3deg) scale(0.94); }
        100% { opacity: 1; transform: rotate(-3deg) scale(1); }
    }
    #ttb-receipt-card {
        background: #f4f1e6; color: #3a3830;
        border: 1px solid #c9c3ae; border-radius: 4px;
        box-shadow: 0 18px 50px rgba(0,0,0,0.55);
        font-family: 'Courier Prime', monospace;
        width: min(340px, 88vw); padding: 18px 22px 20px;
        animation: ttbCardIn 0.3s cubic-bezier(0.2,0.8,0.3,1) both;
    }
    #ttb-receipt-card h2 {
        margin: 0 0 8px; padding-bottom: 7px;
        border-bottom: 1px solid #c9c3ae;
        font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; color: #5f5e5a;
    }
    .ttb-receipt-row {
        display: flex; justify-content: space-between; gap: 12px;
        font-size: 0.8rem; color: #8a887f; padding: 3px 0;
    }
    .ttb-receipt-row.is-today { color: #3a3830; font-weight: 700; }
    .ttb-receipt-stamp {
        margin: 12px 0 4px; display: inline-block;
        border: 2px solid #993c1d; border-radius: 4px; padding: 6px 12px;
        color: #993c1d; animation: ttbStampDown 0.42s ease-out 0.28s both;
    }
    .ttb-receipt-stamp .amt { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em; }
    .ttb-receipt-stamp .lbl { font-size: 0.62rem; letter-spacing: 0.16em; color: #c2582f; }
    #ttb-receipt-close {
        margin-top: 14px; width: 100%; padding: 9px;
        background: #3a3830; color: #f4f1e6; border: none; border-radius: 4px;
        font-family: inherit; font-size: 0.82rem; font-weight: 700; cursor: pointer;
    }
    #ttb-receipt-note { margin-top: 10px; font-size: 0.62rem; color: #97948a; line-height: 1.45; }
    `;
    document.head.appendChild(s);
}

/**
 * @param {object}  week      a readWeek() result — { dates, byDate }
 * @param {string}  todayStr  'YYYY-MM-DD'
 * @param {boolean} partial   true when the read came back !ok
 */
// ⚠️ THIS CONSTANT IS THE VERSION — the comment at the top is decoration.
// versions.js parses THIS line to build the footer panel. Bump both in the
// same edit; tests/version-stamp-test.mjs fails the suite if they disagree.
export const RECEIPT_VERSION = '1.1.0';

export function showReceipt(week, todayStr, partial) {
    injectStyles();
    const old = document.getElementById('ttb-receipt-backdrop');
    if (old) old.remove();

    const dates  = (week && week.dates) || [];
    const byDate = (week && week.byDate) || {};
    const todaySecs = (byDate[todayStr] && byDate[todayStr].seconds) || 0;

    const backdrop = document.createElement('div');
    backdrop.id = 'ttb-receipt-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', 'Your typing this week');

    const card = document.createElement('div');
    card.id = 'ttb-receipt-card';

    const h = document.createElement('h2');
    h.textContent = 'DATE DUE';
    card.appendChild(h);

    // ⚠️ EMPTY DAYS ARE SKIPPED, TODAY NEVER IS. A child who typed on two days
    // should see two lines, not five zeroes padding out a week. But today's line
    // must appear even at 0:00 — pressing the button and being shown nothing
    // about the moment you pressed it reads as a failure.
    for (const d of dates) {
        const secs = (byDate[d] && byDate[d].seconds) || 0;
        const isToday = (d === todayStr);
        if (!secs && !isToday) continue;
        const { dow, stamp } = labelFor(d);
        const row = document.createElement('div');
        row.className = 'ttb-receipt-row' + (isToday ? ' is-today' : '');
        const left = document.createElement('span');
        left.textContent = dow + '  ' + stamp;
        const right = document.createElement('span');
        right.textContent = fmt(secs);
        row.append(left, right);
        card.appendChild(row);
    }

    const { stamp } = labelFor(todayStr);
    const st = document.createElement('div');
    st.className = 'ttb-receipt-stamp';
    const amt = document.createElement('div');
    amt.className = 'amt';
    amt.textContent = stamp + '   ' + fmt(todaySecs);
    const lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.textContent = 'RETURNED';
    st.append(amt, lbl);
    card.appendChild(st);

    const note = document.createElement('div');
    note.id = 'ttb-receipt-note';
    // ⚠️ THE WORDING IS THE SAFEGUARD AND IT IS DELIBERATELY NOT REASSURANCE
    // ABOUT SAVING. "Your time is counted whether or not you press this" would
    // plant the very doubt the button exists to remove. Say what is true and
    // move on.
    note.textContent = partial
        ? 'Some days could not be loaded just now, so this list may be short.'
        : 'Your minutes are counted. See you next time!';
    card.appendChild(note);

    const close = document.createElement('button');
    close.id = 'ttb-receipt-close';
    close.type = 'button';
    close.textContent = 'Close';
    card.appendChild(close);

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    // ⚠️ EVERY EXIT PATH A CHILD WILL TRY. A modal a twelve-year-old cannot
    // dismiss during class is worse than no modal: Close, the backdrop, and Esc.
    const dismiss = () => {
        document.removeEventListener('keydown', onKey, true);
        backdrop.remove();
    };
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); dismiss(); } }
    close.onclick = dismiss;
    backdrop.onclick = (e) => { if (e.target === backdrop) dismiss(); };
    document.addEventListener('keydown', onKey, true);
    close.focus();
}
