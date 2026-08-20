// rules-probe.test.mjs v1.0.0 — THE RULES, EXECUTED.
//
// ⚠️ THIS FILE EXISTS BECAUSE FIVE ROUNDS REASONED ABOUT `firestore.rules`
//    INSTEAD OF RUNNING IT, AND THE FIFTH BUILT A PLAN THE RULES REJECT.
//
// `tests/firestore-rules.test.mjs` carries the line "I COULD NOT RUN THIS —
// the Firestore emulator downloads its jar from storage.googleapis.com, which
// isn't reachable from my sandbox." That sentence was copied forward through
// four rounds and it is FALSE. The sandbox has java and node; the jar downloads.
// See tests/README.md → "Running the rules harnesses" for the four-line setup.
//
// ⚠️ THIS IS NOT A REPLACEMENT FOR firestore-rules.test.mjs. That file is the
// broad security suite and it is STALE — it supplies roles as auth-token claims,
// which rules v2.x stopped reading in favour of `staff/{uid}` documents. See
// HANDOFF §0.-5.G. THIS file is narrow on purpose: it answers only the questions
// a design decision currently depends on, and it answers them by executing.
//
// ⚠️ EVERY ASSERTION HERE IS ABOUT THE RULES AS DEPLOYED, NOT AS INTENDED. If one
// of these flips, the rules changed and something in HANDOFF §0.-5 is now wrong.
//
// ── RUN ──
//   npx firebase emulators:exec --only firestore --project demo-ttb \
//       "npx mocha tests/rules-probe.test.mjs --timeout 20000"
//
// Uses a fake project id. Nothing touches production.

import { initializeTestEnvironment, assertFails, assertSucceeds }
    from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs, query, where }
    from 'firebase/firestore';
import { readFileSync } from 'fs';

const EMS = 'ems', HMS = 'hms';
const JAKE    = 'uid_jake';              // super_admin
const T_BLDG  = 'uid_teacher_building';  // teacher, readScope 'building'
const T_CLASS = 'uid_teacher_class';     // teacher, readScope 'own_classes'
const KID     = 'uid_kid_ems';

let env;

// ⚠️ ROLES LIVE IN `staff/{uid}` DOCUMENTS, NOT IN THE TOKEN. Rules v2.x route
// every staff check through staffDoc(), and v2.3.0 made `active: true`
// mandatory. A context with role claims and no staff document is a STUDENT as
// far as these rules are concerned — that is the single mistake that makes
// firestore-rules.test.mjs report 14 false failures.
const asJake   = () => env.authenticatedContext(JAKE,    { email: 'jake@x.net' });
const asBldg   = () => env.authenticatedContext(T_BLDG,  { email: 'tb@x.net' });
const asClassT = () => env.authenticatedContext(T_CLASS, { email: 'tc@x.net' });
const asKid    = () => env.authenticatedContext(KID,     { email: 'kid@x.net' });

before(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-ttb',
        firestore: {
            rules: readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8'),
        },
    });
});
after(async () => { await env.cleanup(); });

beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, 'staff', JAKE),
            { role: 'super_admin', active: true, schoolIds: [EMS, HMS], readScope: 'building' });
        await setDoc(doc(db, 'staff', T_BLDG),
            { role: 'teacher', active: true, schoolIds: [EMS], readScope: 'building' });
        await setDoc(doc(db, 'staff', T_CLASS),
            { role: 'teacher', active: true, schoolIds: [EMS], readScope: 'own_classes' });
        await setDoc(doc(db, 'classes', 'c_ems'),
            { name: '3rd Period', schoolId: EMS, teacherUids: [T_CLASS, T_BLDG] });

        // ⚠️ THREE STUDENTS, AND THE LAST TWO ARE THE POINT. A roster-imported
        // student who types before ever opening the Lessons page has no
        // schoolId — blank or absent. That is the DAY ONE OF A NEW SCHOOL case
        // reports.html v2.21.0's roster sweep exists for (§0.-4.A), and it is
        // the case a schoolId-dependent read rule is most likely to deny.
        await setDoc(doc(db, 'users', KID),         { classId: 'c_ems', schoolId: EMS });
        await setDoc(doc(db, 'users', 'kid_blank'), { classId: 'c_ems', schoolId: '' });
        await setDoc(doc(db, 'users', 'kid_none'),  { classId: 'c_ems' });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PART A — reports.html v2.21.0's ROSTER SWEEP  (PRIORITY 3)
// ═════════════════════════════════════════════════════════════════════════════
//
// Round 20 shipped readRosterUids() and left a warning that a red "THE ROSTER
// READ FAILED" banner might appear, because nobody had checked whether the
// rules permit a `users` query. These are the three query shapes that function
// can issue. HANDOFF §0.-5.D.
describe('A — the roster sweep (reports.html readRosterUids)', () => {
    const usersOf = (ctx) => collection(ctx.firestore(), 'users');

    it('building-scope teacher may query users by classId', async () => {
        await assertSucceeds(getDocs(query(usersOf(asBldg()), where('classId', '==', 'c_ems'))));
    });

    it('class-scope teacher may query users by classId', async () => {
        await assertSucceeds(getDocs(query(usersOf(asClassT()), where('classId', '==', 'c_ems'))));
    });

    it('building-scope teacher may query users by schoolId', async () => {
        await assertSucceeds(getDocs(query(usersOf(asBldg()), where('schoolId', '==', EMS))));
    });

    it('super_admin may sweep users unfiltered', async () => {
        await assertSucceeds(getDocs(query(usersOf(asJake()))));
    });

    // ⚠️ THE ASSERTION THAT MATTERS. A roster read that succeeds but silently
    // omits the unstamped students is the defect wearing the fix's clothes:
    // those are exactly the children the class query could never see.
    it('the roster query returns blank-schoolId and missing-schoolId students', async () => {
        const snap = await getDocs(query(usersOf(asBldg()), where('classId', '==', 'c_ems')));
        const ids = snap.docs.map(d => d.id).sort();
        if (ids.length !== 3) {
            throw new Error(`roster returned ${ids.length} of 3 — missing: ${ids.join(', ')}`);
        }
    });

    it('a signed-in student may NOT list the roster', async () => {
        await assertFails(getDocs(query(usersOf(asKid()), where('classId', '==', 'c_ems'))));
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PART B — THE §3.1 FIX SHAPE  (PRIORITY 2)
// ═════════════════════════════════════════════════════════════════════════════
//
// ⚠️ crossmode-overwrite-test.mjs Part C GOES GREEN ON A DESIGN THE RULES
// REJECT. It models per-source DOCUMENT ids. The docId binding added in rules
// v2.3.0 — docId == uid + '_' + date — forbids a third segment.
//
// The per-source FIELD shape has been legal since rules v2.4.0 and was never
// rolled back when the writers reverted. HANDOFF §0.-5.B and §0.-5.C.
describe('B — which per-source shape the deployed rules allow', () => {
    const D = '2026-08-20';

    it('FIELDS: a student may create a log carrying only the Library triple', async () => {
        await assertSucceeds(setDoc(doc(asKid().firestore(), 'typing_logs', `${KID}_${D}`), {
            uid: KID, date: D, email: 'kid@x.net', displayName: 'Kid',
            classId: 'c_ems', schoolId: EMS,
            secondsLibrary: 120, charsLibrary: 300, mistakesLibrary: 4,
            lastUpdated: new Date(),
        }, { merge: true }));
    });

    it('FIELDS: the other controller may merge the School triple onto it', async () => {
        const db = asKid().firestore();
        await setDoc(doc(db, 'typing_logs', `${KID}_${D}`), {
            uid: KID, date: D, secondsLibrary: 120, lastUpdated: new Date(),
        }, { merge: true });
        await assertSucceeds(setDoc(doc(db, 'typing_logs', `${KID}_${D}`), {
            uid: KID, date: D, secondsSchool: 240, charsSchool: 600, mistakesSchool: 9,
            lastUpdated: new Date(),
        }, { merge: true }));
    });

    // ⚠️ DOCUMENTS: THIS IS THE §0.-4.C PLAN AND IT IS DENIED. If this ever
    // starts passing, someone widened the docId binding in firestore.rules —
    // and §0.-5.B is out of date, not wrong.
    it('DOCUMENTS: {uid}_{date}_school is DENIED by the docId binding', async () => {
        await assertFails(setDoc(doc(asKid().firestore(), 'typing_logs', `${KID}_${D}_school`), {
            uid: KID, date: D, seconds: 300, chars: 900, mistakes: 3,
            lastUpdated: new Date(),
        }, { merge: true }));
    });

    // ⚠️ THE READ-SIDE BLOCKER, MADE VISIBLE. The rules happily store all three
    // shapes on one document. daylog.js totalsOf() and reports.html
    // readLogTotals() are both LEGACY-FIRST: given this document they return 90
    // and ignore 360 seconds of split fields. That is why a switch to per-source
    // fields is a READER change, not a writer change. HANDOFF §0.-5.C.
    it('a document may carry the flat triple AND both split triples at once', async () => {
        const db = asKid().firestore();
        await setDoc(doc(db, 'typing_logs', `${KID}_${D}`), {
            uid: KID, date: D, secondsLibrary: 120, secondsSchool: 240, lastUpdated: new Date(),
        }, { merge: true });
        await assertSucceeds(setDoc(doc(db, 'typing_logs', `${KID}_${D}`), {
            uid: KID, date: D, seconds: 90, chars: 100, mistakes: 1, lastUpdated: new Date(),
        }, { merge: true }));

        const snap = await getDoc(doc(db, 'typing_logs', `${KID}_${D}`));
        const d = snap.data();
        // Legacy-first, reproduced here so the trap is in the harness and not
        // only in a paragraph of HANDOFF.md.
        const legacyFirst = ('seconds' in d) ? d.seconds
                          : (d.secondsLibrary || 0) + (d.secondsSchool || 0);
        if (legacyFirst !== 90) throw new Error(`expected 90, got ${legacyFirst}`);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PART C — THE OWNER-READ HINGE  (PRIORITY 1)
// ═════════════════════════════════════════════════════════════════════════════
//
// rules v2.5.0's owner-read on typing_logs is the single clause the entire
// one-number architecture rests on. Without it the HUD cannot read the graded
// document and a second copy of the quantity becomes structurally necessary —
// which is how users/{uid}/stats/time_tracking existed for months.
describe('C — the student reads the document the teacher grades', () => {
    const D = '2026-08-20';

    beforeEach(async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'typing_logs', `${KID}_${D}`), {
                uid: KID, date: D, classId: 'c_ems', schoolId: EMS,
                seconds: 600, chars: 1000, mistakes: 20,
            });
        });
    });

    it('the owner may read their own daily log', async () => {
        await assertSucceeds(getDoc(doc(asKid().firestore(), 'typing_logs', `${KID}_${D}`)));
    });

    it('a student may NOT read another student’s daily log', async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'typing_logs', `other_${D}`), {
                uid: 'other', date: D, classId: 'c_ems', schoolId: EMS, seconds: 600,
            });
        });
        await assertFails(getDoc(doc(asKid().firestore(), 'typing_logs', `other_${D}`)));
    });

    it('the teacher reads the same document by the same id', async () => {
        await assertSucceeds(getDoc(doc(asBldg().firestore(), 'typing_logs', `${KID}_${D}`)));
    });
});
