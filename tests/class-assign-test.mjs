// class-assign-test.mjs v1.0.0 — ROADMAP 11. A STUDENT IN A CLASS BUT NOT A SCHOOL.
//
// ═══════════════════════════════════════════════════════════════════════════
// TWO BUGS, TWO FILES, AND FIXING EITHER ONE ALONE FIXES NOTHING VISIBLE
// ═══════════════════════════════════════════════════════════════════════════
//
// Jake, 2026-08-23: *"I'm running all of this as my son, who is a part of my
// 7th & 8th grade class but isn't actually assigned to my school due to an error
// in the admin code."* Third round it was raised. Twice diagnosed, never fixed.
//
// ⚠️ BUG A — THE WRITER. `lessons-admin.js` had THREE paths that assign a class
// and only TWO of them wrote `schoolId`. The single-student save and
// `_bulkAssign()` sent `{ classId }` alone, so the student ends up with
// `schoolId` ABSENT — not empty — and is visible under "All schools" while being
// invisible under their own, and missing from every school-filtered report.
// ⚠️ HANDOFF §6 called this "fine within one building" for three rounds. It was
// never fine, and the correct pattern was already in the same file twice.
//
// ⚠️ BUG B — THE READER. `learn.js`'s goals cache rejected an entry that NAMES a
// class but carries no className. An entry taken BEFORE the student was assigned
// has `classId: ''` — falsy — so it passed as a HIT, and Settings kept saying
// "No class assigned" for up to 24 HOURS after a correct assignment landed.
// ⚠️ A DIRECT ADMIN WRITE CANNOT REACH A CACHE ON THE STUDENT'S CHROMEBOOK, so
// the unassigned state must not be cacheable at all.
//
// ⚠️⚠️ AND THE THIRD THING, WHICH IS THE ONE THAT WOULD HAVE WASTED A ROUND:
// `_classCache` is filled by loadAndRenderClasses(), which runs when the CLASSES
// panel opens. An admin who goes straight to Students has an EMPTY cache — so a
// fix reading `_classCache[classId].schoolId` directly would have looked correct
// and written '' exactly as before. Part C is the assertion that says so.
//
// ⚠️ MUTATION-VERIFIED: 4 failing against lessons-admin.js v1.13.2 + learn.js
// v2.34.0 (Parts A, B and C), and Part D fails against the old cache guard.

import { readFileSync } from 'fs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ FAIL  ' + m); } };

const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const decomment = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1');

const admin = decomment(read('lessons-admin.js'));
const learn = decomment(read('learn.js'));

// Every setDoc into users/{uid} that carries a classId, with its argument text.
function classWrites(src) {
    const out = [];
    const re = /setDoc\(\s*doc\(_db,\s*'users'[\s\S]{0,400}?\{\s*merge:\s*true\s*\}\s*\)/g;
    let m;
    while ((m = re.exec(src))) if (/classId/.test(m[0])) out.push(m[0]);
    return out;
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─── A. ⚠️⚠️ EVERY CLASS ASSIGNMENT CARRIES THE BUILDING ───');
{
    const writes = classWrites(admin);
    ok(writes.length >= 3,
       `A1 found the class-assignment writers — ${writes.length}, expected at least 3 ` +
       '(single-student save, bulk assign, CSV/one-student add)');

    const naked = writes.filter(w => !/schoolId/.test(w));
    ok(naked.length === 0,
       '⚠️⚠️ A2 NOT ONE OF THEM WRITES classId WITHOUT schoolId — ' + naked.length +
       ' does. A student with a class and no building is invisible to their own ' +
       'teacher, which is how Jake\u2019s son ended up outside his own school');
}

console.log('\n─── B. THE BUILDING IS LOOKED UP, NOT ASSUMED ───');
{
    ok(/async function _schoolIdForClass\s*\(/.test(admin),
       'B1 there is one place that answers "which building is this class in?"');
    // ⚠️ ONE ANSWERER, NOT THREE. Three inline lookups is three chances to drift,
    // and this file has already proved it drifts (Bug A is exactly that).
    const inline = (admin.match(/_classCache\[[A-Za-z_]+\]\s*&&\s*_classCache\[[A-Za-z_]+\]\.schoolId/g) || []);
    ok(inline.length === 0,
       'B2 ⚠️ no writer reaches into _classCache for a schoolId on its own — ' +
       inline.length + ' still do. Rule 9: one answerer');
}

console.log('\n─── C. ⚠️ THE COLD CACHE, WHICH IS WHERE THE OBVIOUS FIX DIES ───');
{
    const fn = admin.slice(admin.indexOf('async function _schoolIdForClass'));
    const body = fn.slice(0, fn.indexOf('\n}\n') + 3);
    ok(/_classCache\[/.test(body), 'C1 it prefers the cache when the cache has it');
    ok(/getDoc\(\s*doc\(_db,\s*'classes'/.test(body),
       '⚠️⚠️ C2 AND IT FALLS BACK TO THE CLASS DOCUMENT WHEN THE CACHE IS COLD. ' +
       '_classCache is filled when the CLASSES panel opens; an admin who goes ' +
       'straight to Students has an empty one, and a cache-only fix writes \'\' ' +
       'exactly as the bug did');
}

console.log('\n─── D. AN UNASSIGNED STUDENT IS NOT A CACHEABLE ANSWER ───');
{
    // The guard, extracted from source so the assertion is about the shipped line.
    const m = /const c = \(c0 && ([\s\S]*?)\)\s*\?\s*null\s*:\s*c0;/.exec(learn);
    ok(!!m, 'D1 the goals-cache hit guard is where it was');
    if (m) {
        const guard = new Function('c0', 'return (c0 && (' + m[1] + ')) ? null : c0;');
        const assigned   = { classId: 'c1', className: '7th Period', dailySeconds: 600 };
        const unassigned = { classId: '',   className: '',           dailySeconds: 600 };
        const halfWritten= { classId: 'c1', className: '',           dailySeconds: 600 };

        ok(guard(assigned) !== null,
           'D2 a complete entry is still a HIT — the cache must not stop working');
        ok(guard(halfWritten) === null,
           'D3 an entry naming a class with no className is still a miss (v2.28.0)');
        ok(guard(unassigned) === null,
           '⚠️⚠️ D4 AN ENTRY RECORDED BEFORE THE STUDENT WAS ASSIGNED IS A MISS. ' +
           'classId \'\' is FALSY, so the old guard passed it as a hit and Settings ' +
           'answered "No class assigned" for 24 hours after a correct assignment. ' +
           'A direct admin write cannot reach a cache on the student\u2019s Chromebook');
    }
}

console.log(`\n${fail === 0 ? 'PASS' : 'RED'} — ${pass} passing, ${fail} failing`);
process.exit(fail === 0 ? 0 : 1);
