// chapter-position.js v1.0.0
//
// v1.0.0 — ⭐ ROADMAP 26. Two things index.html needs in TWO places: where a
//          student is in a book, and when they last touched it. The chapter
//          math lived inline in renderBooks(); the Continue-reading row's new
//          progress bar needed the SAME number, and copying it would have made
//          the fifth hand-maintained twin this project has had to hunt down
//          (celebrate.js, hud.js, the grade rule, the build panel — every one
//          found by DRIFTING, not by breaking).
//
//          ⚠️ THIS IS A MODULE, NOT A LOCAL FUNCTION, ON PURPOSE. A function
//          inside index.html would have removed the twin just as well, and
//          that is what the first pass did — but it left the rule reachable
//          only by a harness that lifts source text out of an HTML file by
//          walking braces. A module is importable by the page AND by the
//          tests, which is the whole reason firebase-config.js, stats-wal.js,
//          session-log.js and hud.js are modules too. Jake asked the right
//          question about this and the answer was to move it here.
//
//          ⚠️ REGISTERED IN THREE PLACES, and it has to be all three or the
//          build panel lies: versions.js's SOURCES (so the footer can report
//          it), tools/audit-versions.mjs (so `npm run audit:versions` sees a
//          drifted stamp), and tests/version-stamp-test.mjs. §9b is the round
//          where three shared modules were invisible to the footer for weeks
//          because only the first of those was done.

export const CHAPTER_POSITION_VERSION = '1.0.0';

// Where the student is in this book, for DISPLAY.
//
// ⚠️ RETURNS null, NOT A ZEROED OBJECT, when the position is unknowable. Every
// caller must decide what to draw; both of index.html's draw nothing. A 0% bar
// would tell a child they have read none of a book they are halfway through,
// which is worse than an absent bar, because it is a confident wrong answer.
//
// ⚠️ THIS IS CHAPTER POSITION, NOT completedChapters, and it is NOT
// interchangeable with index.html's progressOf(). progressOf() answers "how
// much is finished" and exists for SORTING; this answers "where are they" and
// exists for DISPLAY. They legitimately disagree — a child on ch. 5 who has
// finished 3 is 42% by one and 25% by the other — so using the wrong one for
// the Continue-reading bar would have put two different percentages for one
// book on one screen, which is exactly the class of quiet inconsistency that
// takes a week to notice and an afternoon to trace.
//
// The chapter LIST is only present on a cold load — it is stripped before
// caching because it is the largest field on the book document — and old book
// documents have no `matter` on their entries at all. So this degrades in
// three steps rather than assuming the best case. game.js v3.10.0 writes
// bodyIndex/bodyTotal onto the progress document, which is the ONLY source
// that survives the grid cache. Prefer it, then the list, then arithmetic.
export function chapterPositionOf(book, progress) {
    if (!book) return null;
    const denom = (typeof progress?.bodyTotal === 'number' && progress.bodyTotal > 0)
        ? progress.bodyTotal
        : ((typeof book.bodyChapters === 'number' && book.bodyChapters > 0)
            ? book.bodyChapters : book.totalChapters);
    if (!progress || !(denom > 0)) return null;
    const curId = String(progress.chapter || 'chapter_1');
    let chapNum = (typeof progress.bodyIndex === 'number' && progress.bodyIndex > 0)
        ? progress.bodyIndex : null;
    if (chapNum === null && book.chapters && book.chapters.length) {
        const bodyOnly = book.chapters.filter(c => (c.matter || 'body') === 'body');
        const list = bodyOnly.length ? bodyOnly : book.chapters;
        const at = list.findIndex(c => String(c.id) === curId);
        if (at !== -1) chapNum = at + 1;
    }
    // Fallback for a cached grid or a pre-v3.19.1 document. parseFloat, not
    // parseInt, so 2.09 does not silently become 2 — and it is rounded back to
    // a whole number for display.
    if (chapNum === null) {
        const raw = parseFloat(curId.replace('chapter_', ''));
        chapNum = Number.isFinite(raw) ? Math.max(1, Math.round(raw)) : 1;
    }
    const pct = Math.min(100, Math.round((chapNum / denom) * 100));
    return { chapNum, denom, pct };
}

// "Last read …" for the Continue-reading row.
//
// ⚠️ COARSE ON PURPOSE, AND IT NEVER PRINTS MINUTES. The stamp behind it is
// `lastUpdated`, written when progress is SAVED, not when the child stopped
// typing. "14 minutes ago" would be a precision the underlying field does not
// have. Days are safe; anything inside a day is "today".
//
// `now` is injectable so the tests do not have to move the clock. Callers pass
// nothing.
export function lastReadLabel(ms, now = Date.now()) {
    if (!ms || !Number.isFinite(ms)) return '';
    const days = Math.floor((now - ms) / 86400000);
    if (days < 0) return 'Last read today';   // a clock-skewed future stamp
    if (days === 0) return 'Last read today';
    if (days === 1) return 'Last read yesterday';
    if (days < 7) return `Last read ${days} days ago`;
    if (days < 14) return 'Last read last week';
    if (days < 60) return `Last read ${Math.floor(days / 7)} weeks ago`;
    return 'Last read a while ago';
}
