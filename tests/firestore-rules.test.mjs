// firestore-rules.test.mjs v2.1.0 — Round 21 (Hammond). REWRITTEN SEED.
//
// v2.1.0 — Round 46 (Rem-Sho), ROADMAP item 24. Four new cases under 'student
//          access' cover firestore.rules v2.8.0's typing_sessions owner
//          UPDATE — the rule session-log.js v1.7.0's idempotent resend needs.
//          Needs the emulator; `npm test` cannot see a rules denial. Run
//          `npm run test:rules` before deploying either change.
//
// ⚠️ THE OLD HEADER SAID "I COULD NOT RUN THIS." IT WAS FALSE FOR FOUR ROUNDS.
// The Firebase emulator runs fine — java plus a jar from storage.googleapis.com.
// That copied sentence is the most expensive line in this repo: because nobody
// ran this file, Round 20 designed a §3.1 fix around per-source document ids
// that firestore.rules v2.5.0 DENIES, and it was one session from student
// write failures at two schools. See HANDOFF §0.-5.A and §0.-5.B.
//
// Run:  npm run test:rules
//   or  npx firebase emulators:exec --only firestore --project demo-ttb \
//           "npx mocha tests/firestore-rules.test.mjs --timeout 20000"
//
// ⚠️ WHAT v2.0.0 CHANGED, AND WHY IT WAS 14 RED: this file was written for rules
// v1.1.0, when a person's role lived in their AUTH TOKEN. Rules v2.x read it from
// a `staff/{uid}` DOCUMENT via staffDoc(), and v2.3.0 made `active: true`
// mandatory. So `authenticatedContext(uid, { role: 'teacher' })` produced a
// context the rules treat as a STUDENT, and every staff assertion failed with
// "Property active is undefined on object". The rules were never broken. THE
// TEST WAS. Three specific repairs:
//
//   1. Every persona now gets a real staff document with active: true.
//   2. TEACHER_EMS was serving TWO personas — 'building' scope and 'own_classes'
//      scope — which worked only while the difference lived in a token. It
//      cannot work against a document: one uid, one readScope. Split into
//      TEACHER_EMS and CLASS_TEACHER.
//   3. Class membership moved to classes/{id}.teacherUids; the old seed left it
//      undefined, which is a rules-side "Property teacherUids is undefined".
//
// ⚠️ AND ONE ASSERTION WAS SIMPLY WRONG. The token-less block bundled three
// reads into one `it()`, so a failure could not be localised. Split (below), it
// resolves cleanly: books/{id} is `allow read: if true` ON PURPOSE — a guest
// must be able to read a book before signing in, which is the whole anonymous
// path in game.js. Student data and classes ARE correctly denied. The old
// assertion asserted a policy this project does not have.
//
// ⚠️ THIS FILE IS THE BROAD SECURITY SUITE. For the narrow questions a design
// decision currently rests on — the roster sweep, the per-source shape, the
// owner read — see rules-probe.test.mjs, which is deliberately small.
//
import { initializeTestEnvironment, assertFails, assertSucceeds }
    from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc }
    from 'firebase/firestore';
import { readFileSync } from 'fs';
import assert from 'assert';

let env;

// ── Cast of characters ──
const EMS = 'ems', HMS = 'hms';                 // two buildings
const JAKE = 'uid_jake';                        // super_admin
const TEACHER_EMS = 'uid_teacher_ems';          // teacher at EMS
const TEACHER_HMS = 'uid_teacher_hms';          // teacher at HMS
const KID_EMS = 'uid_kid_ems';                  // student at EMS
const KID_HMS = 'uid_kid_hms';                  // student at HMS

const asJake       = () => env.authenticatedContext(JAKE, { role: 'super_admin', schoolIds: [EMS, HMS], email: 'jake@x.net' });
// readScope is per-person. A teacher defaults to 'own_classes'; a building_admin
// grants 'building' when they want that teacher to see the whole school.
const asTeacherEms = () => env.authenticatedContext(TEACHER_EMS,
    { role: 'teacher', schoolIds: [EMS], readScope: 'building', email: 't_ems@x.net' });
// ⚠️ CLASS_TEACHER IS A SEPARATE UID AS OF v2.0.0. It used to be TEACHER_EMS with
// a different token claim. One uid cannot hold two readScopes once the scope
// lives in a document — the staff doc wins and the persona silently collapses
// into whichever was written last.
const CLASS_TEACHER = 'uid_teacher_class_ems';
const asClassTeacher = () => env.authenticatedContext(CLASS_TEACHER,
    { role: 'teacher', schoolIds: [EMS], readScope: 'own_classes', classIds: ['c_ems'], email: 't_class@x.net' });
const asOtherClassTeacher = () => env.authenticatedContext('uid_other_ems',
    { role: 'teacher', schoolIds: [EMS], readScope: 'own_classes', classIds: ['c_other'], email: 'other@x.net' });
const asBldgAdminEms = () => env.authenticatedContext('uid_ba_ems',
    { role: 'building_admin', schoolIds: [EMS], email: 'ba_ems@x.net' });
const asTeacherHms = () => env.authenticatedContext(TEACHER_HMS, { role: 'teacher', schoolIds: [HMS], email: 't_hms@x.net' });
const asKidEms     = () => env.authenticatedContext(KID_EMS, { email: 'kid_ems@x.net' });
const asKidHms     = () => env.authenticatedContext(KID_HMS, { email: 'kid_hms@x.net' });
const asAnon       = () => env.unauthenticatedContext();

before(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-ttb',
        firestore: { rules: readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8') },
    });
});
after(async () => { await env.cleanup(); });

beforeEach(async () => {
    await env.clearFirestore();
    // Seed with rules disabled.
    await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, 'schools', EMS), { name: 'Ellis MS' });
        await setDoc(doc(db, 'schools', HMS), { name: 'Hendersonville MS' });
        await setDoc(doc(db, 'users', KID_EMS), { classId: 'c_ems', schoolId: EMS });
        await setDoc(doc(db, 'users', KID_HMS), { classId: 'c_hms', schoolId: HMS });
        await setDoc(doc(db, 'users', KID_EMS, 'stats', 'time_tracking'), { secondsToday: 100 });
        // ⚠️ teacherUids IS THE SOURCE OF CLASS MEMBERSHIP as of rules v2.x —
        // teachesClass() reads it. Leaving it undefined errors the rule.
        await setDoc(doc(db, 'classes', 'c_ems'), { name: '3rd Period', schoolId: EMS, dailySeconds: 600, teacherUids: [CLASS_TEACHER, TEACHER_EMS] });
        await setDoc(doc(db, 'classes', 'c_other'), { name: '4th Period', schoolId: EMS, dailySeconds: 600, teacherUids: ['uid_other_ems'] });
        await setDoc(doc(db, 'typing_logs', 'uid_kid_other_2026-07-30'), { uid: 'uid_kid_other', schoolId: EMS, classId: 'c_other', date: '2026-07-30', seconds: 300 });
        await setDoc(doc(db, 'classes', 'c_hms'), { name: '1st Period', schoolId: HMS, dailySeconds: 600, teacherUids: [TEACHER_HMS] });
        await setDoc(doc(db, 'typing_logs', `${KID_EMS}_2026-07-30`), { uid: KID_EMS, schoolId: EMS, classId: 'c_ems', date: '2026-07-30', seconds: 300 });
        await setDoc(doc(db, 'typing_logs', `${KID_HMS}_2026-07-30`), { uid: KID_HMS, schoolId: HMS, classId: 'c_hms', date: '2026-07-30', seconds: 300 });
        // ⚠️ STAFF DOCUMENTS, NOT TOKEN CLAIMS, AND `active: true` IS MANDATORY
        // (rules v2.3.0). A missing `active` does not read as false — it reads as
        // undefined and the rule errors out, which is what produced fourteen
        // failures that looked like broken rules.
        await setDoc(doc(db, 'staff', JAKE),
            { role: 'super_admin', active: true, schoolIds: [EMS, HMS], readScope: 'building' });
        await setDoc(doc(db, 'staff', TEACHER_EMS),
            { role: 'teacher', active: true, schoolIds: [EMS], readScope: 'building' });
        await setDoc(doc(db, 'staff', CLASS_TEACHER),
            { role: 'teacher', active: true, schoolIds: [EMS], readScope: 'own_classes', classIds: ['c_ems'] });
        await setDoc(doc(db, 'staff', TEACHER_HMS),
            { role: 'teacher', active: true, schoolIds: [HMS], readScope: 'building' });
        await setDoc(doc(db, 'staff', 'uid_ba_ems'),
            { role: 'building_admin', active: true, schoolIds: [EMS] });
        await setDoc(doc(db, 'staff', 'uid_other_ems'),
            { role: 'teacher', active: true, schoolIds: [EMS], readScope: 'own_classes', classIds: ['c_other'] });
        await setDoc(doc(db, 'leaderboard', KID_EMS), { initials: 'AB', bestWPM: 40, leaderboardOptOut: false });
        await setDoc(doc(db, 'books', 'b1'), { title: 'Test' });
        await setDoc(doc(db, 'settings', 'goals'), { dailySeconds: 600 });
    });
});

// ═══════════════════════════ the boundary that matters ═══════════════════════
describe('building isolation', () => {
    it('teacher reads a log from their OWN building', async () => {
        const db = asTeacherEms().firestore();
        await assertSucceeds(getDoc(doc(db, 'typing_logs', `${KID_EMS}_2026-07-30`)));
    });

    it('teacher CANNOT read a log from another building', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(getDoc(doc(db, 'typing_logs', `${KID_HMS}_2026-07-30`)));
    });

    it('teacher CANNOT read another building via a scoped query', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(getDocs(query(collection(db, 'typing_logs'), where('schoolId', '==', HMS))));
    });

    it('teacher CANNOT list typing_logs unscoped', async () => {
        // This is the one that breaks lessons-admin.js pre-v1.5.0.
        const db = asTeacherEms().firestore();
        await assertFails(getDocs(collection(db, 'typing_logs')));
    });

    it('teacher CAN query their own building', async () => {
        const db = asTeacherEms().firestore();
        await assertSucceeds(getDocs(query(collection(db, 'typing_logs'), where('schoolId', '==', EMS))));
    });

    it('super_admin can list typing_logs unscoped', async () => {
        const db = asJake().firestore();
        await assertSucceeds(getDocs(collection(db, 'typing_logs')));
    });

    it('teacher reads a student user doc in their building but not elsewhere', async () => {
        await assertSucceeds(getDoc(doc(asTeacherEms().firestore(), 'users', KID_EMS)));
        await assertFails(getDoc(doc(asTeacherEms().firestore(), 'users', KID_HMS)));
    });
});

// ═════════════════ per-person read scope (the v1.1.0 model) ═════════════════
describe('readScope', () => {
    beforeEach(async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            const db = ctx.firestore();
            await setDoc(doc(db, 'classes', 'c_other'), { name: 'Someone else', schoolId: EMS, teacherUids: ['uid_other_ems'] });
            await setDoc(doc(db, 'typing_logs', 'uid_kid2_2026-07-30'),
                { uid: 'uid_kid2', schoolId: EMS, classId: 'c_other', date: '2026-07-30', seconds: 100 });
        });
    });

    it("own_classes teacher reads their OWN class's logs", async () => {
        await assertSucceeds(getDoc(doc(asClassTeacher().firestore(), 'typing_logs', `${KID_EMS}_2026-07-30`)));
    });

    it("own_classes teacher CANNOT read a colleague's class in the same building", async () => {
        // This is the whole point of the setting.
        await assertFails(getDoc(doc(asClassTeacher().firestore(), 'typing_logs', 'uid_kid2_2026-07-30')));
    });

    it('own_classes teacher can query by their own classId', async () => {
        await assertSucceeds(getDocs(query(collection(asClassTeacher().firestore(), 'typing_logs'),
            where('classId', '==', 'c_ems'))));
    });

    it("own_classes teacher CANNOT query a colleague's classId", async () => {
        await assertFails(getDocs(query(collection(asClassTeacher().firestore(), 'typing_logs'),
            where('classId', '==', 'c_other'))));
    });

    it('own_classes teacher CANNOT query the whole building', async () => {
        await assertFails(getDocs(query(collection(asClassTeacher().firestore(), 'typing_logs'),
            where('schoolId', '==', EMS))));
    });

    it("building-scope teacher CAN read a colleague's class", async () => {
        await assertSucceeds(getDoc(doc(asTeacherEms().firestore(), 'typing_logs', 'uid_kid2_2026-07-30')));
    });

    it('building_admin reads the whole building without needing classIds', async () => {
        const db = asBldgAdminEms().firestore();
        await assertSucceeds(getDoc(doc(db, 'typing_logs', 'uid_kid2_2026-07-30')));
        await assertSucceeds(getDocs(query(collection(db, 'typing_logs'), where('schoolId', '==', EMS))));
    });

    it('building_admin still cannot reach another building', async () => {
        await assertFails(getDoc(doc(asBldgAdminEms().firestore(), 'typing_logs', `${KID_HMS}_2026-07-30`)));
    });
});

// ══════════ the escalation this model created, and the rule that closes it ══════════
describe('class ownership', () => {
    beforeEach(async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'classes', 'c_other'),
                { name: 'Someone else', schoolId: EMS, teacherUids: ['uid_other_ems'] });
        });
    });

    it("a teacher CANNOT add themselves to a colleague's class", async () => {
        // Without this rule, claim.classIds being derived from teacherUids means
        // any teacher could self-serve their way into any class in the building.
        await assertFails(setDoc(doc(asClassTeacher().firestore(), 'classes', 'c_other'),
            { name: 'Someone else', schoolId: EMS, teacherUids: ['uid_other_ems', TEACHER_EMS] }));
    });

    it('a teacher CAN edit a class they already teach', async () => {
        await assertSucceeds(setDoc(doc(asClassTeacher().firestore(), 'classes', 'c_ems'),
            { name: 'Renamed', schoolId: EMS, teacherUids: [TEACHER_EMS] }));
    });

    it('a teacher must put themselves on a class they create', async () => {
        const db = asClassTeacher().firestore();
        await assertFails(setDoc(doc(db, 'classes', 'c_orphan'), { name: 'Orphan', schoolId: EMS }));
        // ⚠️ MUST BE THE ACTING UID. The rule is `request.auth.uid in
        // request.resource.data.teacherUids` — naming a DIFFERENT teacher is
        // exactly the case it refuses. This read TEACHER_EMS until v2.0.0, which
        // only passed while the two personas shared one uid.
        await assertSucceeds(setDoc(doc(db, 'classes', 'c_mine2'),
            { name: 'Mine', schoolId: EMS, teacherUids: [CLASS_TEACHER] }));
    });

    it('a class with no schoolId cannot be created', async () => {
        await assertFails(setDoc(doc(asClassTeacher().firestore(), 'classes', 'c_nada'),
            { name: 'No building', teacherUids: [TEACHER_EMS] }));
    });

    it("building_admin CAN edit any class in their building", async () => {
        await assertSucceeds(setDoc(doc(asBldgAdminEms().firestore(), 'classes', 'c_other'),
            { name: 'Reassigned', schoolId: EMS, teacherUids: ['uid_other_ems'] }));
    });

    it('building_admin cannot touch a class in another building', async () => {
        await assertFails(setDoc(doc(asBldgAdminEms().firestore(), 'classes', 'c_hms'),
            { name: 'Nope', schoolId: HMS }));
    });
});

// ═══════════════════ staff records are function-only ═══════════════════
describe('staff records', () => {
    it('NOBODY can write a staff record from a client — not even super_admin', async () => {
        // pushClaims() in functions/index.js is the only writer, via the Admin
        // SDK, which bypasses rules. That's what keeps claim and record in step.
        await assertFails(setDoc(doc(asJake().firestore(), 'staff', TEACHER_EMS),
            { role: 'teacher', schoolIds: [EMS] }));
        await assertFails(setDoc(doc(asBldgAdminEms().firestore(), 'staff', TEACHER_EMS),
            { role: 'building_admin', schoolIds: [EMS] }));
    });
    it('staff can read staff records; students cannot', async () => {
        await assertSucceeds(getDoc(doc(asTeacherEms().firestore(), 'staff', TEACHER_EMS)));
        await assertFails(getDoc(doc(asKidHms().firestore(), 'staff', TEACHER_EMS)));
    });
    it('a person can read their own staff record even without a role', async () => {
        await assertSucceeds(getDoc(doc(asKidEms().firestore(), 'staff', KID_EMS)));
    });
});

// ═══════════════════════════ students ═══════════════════════════
describe('student access', () => {
    it('student reads and writes their own data', async () => {
        const db = asKidEms().firestore();
        await assertSucceeds(getDoc(doc(db, 'users', KID_EMS)));
        await assertSucceeds(setDoc(doc(db, 'users', KID_EMS, 'progress', 'b1'), { chapter: 2 }));
    });

    it('student CANNOT read another student', async () => {
        const db = asKidEms().firestore();
        await assertFails(getDoc(doc(db, 'users', KID_HMS)));
        await assertFails(getDoc(doc(db, 'users', KID_HMS, 'stats', 'time_tracking')));
    });

    it('student writes their OWN daily log', async () => {
        const db = asKidEms().firestore();
        await assertSucceeds(setDoc(doc(db, 'typing_logs', `${KID_EMS}_2026-07-31`),
            { uid: KID_EMS, schoolId: EMS, date: '2026-07-31', seconds: 60 }));
    });

    it("student CANNOT forge another student's log", async () => {
        const db = asKidEms().firestore();
        // Right doc id, wrong uid in the payload.
        await assertFails(setDoc(doc(db, 'typing_logs', `${KID_EMS}_2026-07-31`),
            { uid: KID_HMS, schoolId: EMS, date: '2026-07-31', seconds: 60 }));
        // Wrong doc id entirely.
        await assertFails(setDoc(doc(db, 'typing_logs', `${KID_HMS}_2026-07-31`),
            { uid: KID_HMS, schoolId: HMS, date: '2026-07-31', seconds: 60 }));
    });

    it('student CANNOT read another student\'s typing log', async () => {
        await assertFails(getDoc(doc(asKidEms().firestore(), 'typing_logs', `${KID_HMS}_2026-07-30`)));
    });

    // ⚠️ Round 46 (Rem-Sho), ROADMAP item 24 — the writer half. session-log.js
    // v1.7.0 makes the queue flush idempotent by deriving a stable document id
    // and calling setDoc() (an UPDATE once the id already exists) instead of
    // addDoc(). Before firestore.rules v2.8.0 that update was isSuper()-only,
    // so a real student resend would be DENIED and retry forever. These four
    // cases are the ones that would have caught that silently, since none of
    // them show up in `npm test` — only the emulator sees rule denials.
    it('student CAN update their OWN typing_sessions doc (the resend path)', async () => {
        const db = asKidEms().firestore();
        const ref = doc(db, 'typing_sessions', `${KID_EMS}|first|library|pinocchio`);
        const base = { uid: KID_EMS, seconds: 70, sprints: [{ a: 1 }],
                        expiresAt: new Date(Date.now() + 1000) };
        await assertSucceeds(setDoc(ref, base));                    // create
        // The resend: same id, superset payload — exactly what a second flush
        // of an unflushed queue derives and writes.
        await assertSucceeds(setDoc(ref, { ...base, seconds: 150,
                                            sprints: [{ a: 1 }, { a: 2 }] }));
    });

    it("student CANNOT update another student's typing_sessions doc", async () => {
        const hmsDb = asKidHms().firestore();
        const ref = doc(hmsDb, 'typing_sessions', `${KID_HMS}|first|library|x`);
        await assertSucceeds(setDoc(ref, { uid: KID_HMS, seconds: 60, sprints: [{ a: 1 }],
                                            expiresAt: new Date(Date.now() + 1000) }));
        const db = asKidEms().firestore();
        await assertFails(setDoc(doc(db, 'typing_sessions', `${KID_HMS}|first|library|x`),
            { uid: KID_HMS, seconds: 999, sprints: [{ a: 1 }], expiresAt: new Date(Date.now() + 1000) }));
    });

    it('student CANNOT update typing_sessions with an out-of-range value', async () => {
        const db = asKidEms().firestore();
        const ref = doc(db, 'typing_sessions', `${KID_EMS}|first|library|y`);
        const base = { uid: KID_EMS, seconds: 60, sprints: [{ a: 1 }],
                        expiresAt: new Date(Date.now() + 1000) };
        await assertSucceeds(setDoc(ref, base));
        // A resend must pass the SAME clamps as create — seconds beyond a day
        // is exactly the forged-value case the create rule already refuses.
        await assertFails(setDoc(ref, { ...base, seconds: 999999 }));
    });

    it('student CANNOT delete their own typing_sessions doc', async () => {
        const db = asKidEms().firestore();
        const ref = doc(db, 'typing_sessions', `${KID_EMS}|first|library|z`);
        await assertSucceeds(setDoc(ref, { uid: KID_EMS, seconds: 60, sprints: [{ a: 1 }],
                                            expiresAt: new Date(Date.now() + 1000) }));
        await assertFails(deleteDoc(ref));
    });

    it('student CANNOT edit books, lessons, or settings', async () => {
        const db = asKidEms().firestore();
        await assertFails(setDoc(doc(db, 'books', 'b1'), { title: 'Hacked' }));
        await assertFails(setDoc(doc(db, 'settings', 'goals'), { dailySeconds: 0 }));
    });

    it('student reads books, lessons, settings, and their class', async () => {
        const db = asKidEms().firestore();
        await assertSucceeds(getDoc(doc(db, 'books', 'b1')));
        await assertSucceeds(getDoc(doc(db, 'settings', 'goals')));
        await assertSucceeds(getDoc(doc(db, 'classes', 'c_ems')));
    });
});

// ═══════════════════════════ leaderboard ═══════════════════════════
describe('leaderboard', () => {
    it('any signed-in student can read it', async () => {
        await assertSucceeds(getDocs(collection(asKidEms().firestore(), 'leaderboard')));
    });
    it('a student can write only their own row', async () => {
        const db = asKidEms().firestore();
        await assertSucceeds(setDoc(doc(db, 'leaderboard', KID_EMS), { initials: 'AB', bestWPM: 50, leaderboardOptOut: false }));
        await assertFails(setDoc(doc(db, 'leaderboard', KID_HMS), { bestWPM: 999 }));
    });
    it('anonymous users are shut out', async () => {
        await assertFails(getDocs(collection(asAnon().firestore(), 'leaderboard')));
    });
});

// ═══════════════════════════ privilege escalation ═══════════════════════════
describe('privilege escalation', () => {
    it('a teacher CANNOT grant themselves another school', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'staff', TEACHER_EMS), { role: 'teacher', schoolIds: [EMS, HMS] }));
    });
    it('a teacher CANNOT make themselves super_admin', async () => {
        await assertFails(setDoc(doc(asTeacherEms().firestore(), 'staff', TEACHER_EMS), { role: 'super_admin', schoolIds: [EMS] }));
    });
    it('an own_classes teacher CANNOT widen their own scope', async () => {
        await assertFails(setDoc(doc(asClassTeacher().firestore(), 'staff', TEACHER_EMS),
            { role: 'teacher', schoolIds: [EMS], readScope: 'building' }));
    });
    it('a student CANNOT create a staff record', async () => {
        await assertFails(setDoc(doc(asKidEms().firestore(), 'staff', KID_EMS), { role: 'super_admin', schoolIds: [EMS] }));
    });
    it('a teacher CANNOT create a class in another building', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'classes', 'c_new'), { name: 'Sneaky', schoolId: HMS }));
    });
    // ⚠️ THIS ASSERTION USED TO OMIT teacherUids AND EXPECT SUCCESS. It was
    // asserting a policy this project does not have: a plain teacher must put
    // themselves on a class they create, or they would make a class they cannot
    // then read. The rule is right; the test was wrong. Both halves are asserted
    // now so the requirement is visible rather than incidental.
    it('a teacher CAN create a class in their own building — WITH themselves on it', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'classes', 'c_new_orphan'), { name: 'Mine', schoolId: EMS }));
        await assertSucceeds(setDoc(doc(db, 'classes', 'c_new'),
            { name: 'Mine', schoolId: EMS, teacherUids: [TEACHER_EMS] }));
    });
    it('a teacher CANNOT move their class to another building', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'classes', 'c_ems'), { name: '3rd Period', schoolId: HMS }));
    });
    it('a student CANNOT create a class', async () => {
        await assertFails(setDoc(doc(asKidEms().firestore(), 'classes', 'c_x'), { name: 'x', schoolId: EMS }));
    });
    it('a teacher CANNOT create a school', async () => {
        await assertFails(setDoc(doc(asTeacherEms().firestore(), 'schools', 'new'), { name: 'Fake' }));
    });
    it('nobody can touch practice_limits', async () => {
        await assertFails(getDoc(doc(asJake().firestore(), 'practice_limits', KID_EMS)));
        await assertFails(setDoc(doc(asKidEms().firestore(), 'practice_limits', KID_EMS), { count: 0 }));
    });
});

// ═══════════════════════ admin time correction ═══════════════════════
// reports.html lets staff adjust a student's recorded seconds. This is the path
// my first draft of the rules broke.
describe('time correction (reports.html)', () => {
    it('teacher can correct a student in their building', async () => {
        const db = asTeacherEms().firestore();
        await assertSucceeds(setDoc(doc(db, 'users', KID_EMS, 'stats', 'time_tracking'),
            { secondsToday: 50 }, { merge: true }));
    });
    it('teacher CANNOT correct a student in another building', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'users', KID_HMS, 'stats', 'time_tracking'),
            { secondsToday: 50 }, { merge: true }));
    });
    it('super_admin can correct anyone', async () => {
        const db = asJake().firestore();
        await assertSucceeds(setDoc(doc(db, 'users', KID_HMS, 'stats', 'time_tracking'),
            { secondsToday: 50 }, { merge: true }));
    });
});

// ═══════════════ grade reconstruction (ROADMAP 15, reports.html) ═══════════════
// ⚠⚠ THE ⚑ BUTTON WRITES TO A STUDENT'S lessonProgress, AND UNTIL rules v2.7.0
// NOTHING IN THIS FILE COULD. The rule was `request.auth.uid == uid` with no
// staff branch, so the feature would have failed permission-denied for every
// student except Jake's own account — the one account that never needed it.
// Rule 9: the rule change shipped in the same round as the button.
describe('grade reconstruction (lessonProgress)', () => {
    it('teacher can write lessonProgress for a student in their building', async () => {
        const db = asTeacherEms().firestore();
        await assertSucceeds(setDoc(doc(db, 'users', KID_EMS, 'lessonProgress', 'u1_l1'),
            { runGrades: { '0': 'A' }, runGradesFrom: { '0': 'sessions' } }, { merge: true }));
    });
    it('teacher CANNOT write lessonProgress for a student in another building', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'users', KID_HMS, 'lessonProgress', 'u1_l1'),
            { runGrades: { '0': 'A' } }, { merge: true }));
    });
    it('super_admin can write anyone\u2019s lessonProgress', async () => {
        const db = asJake().firestore();
        await assertSucceeds(setDoc(doc(db, 'users', KID_HMS, 'lessonProgress', 'u1_l1'),
            { runGrades: { '0': 'A' } }, { merge: true }));
    });
    it('\u26a0 THE STAFF BRANCH IS lessonProgress ONLY \u2014 not profile', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'users', KID_EMS, 'profile', 'main'),
            { displayName: 'changed' }, { merge: true }));
    });
    it('\u26a0 ...and not progress', async () => {
        const db = asTeacherEms().firestore();
        await assertFails(setDoc(doc(db, 'users', KID_EMS, 'progress', 'book1'),
            { pos: 5 }, { merge: true }));
    });
    it('a student still writes their own lessonProgress', async () => {
        const db = asKidEms().firestore();
        await assertSucceeds(setDoc(doc(db, 'users', KID_EMS, 'lessonProgress', 'u1_l1'),
            { runGrades: { '0': 'B' } }, { merge: true }));
    });
    it('\u26a0 a student CANNOT write another student\u2019s lessonProgress', async () => {
        const db = asKidEms().firestore();
        await assertFails(setDoc(doc(db, 'users', KID_HMS, 'lessonProgress', 'u1_l1'),
            { runGrades: { '0': 'A' } }, { merge: true }));
    });
});

// ═══════════════════════ roster pre-assignment ═══════════════════════
describe('pendingClassAssignments', () => {
    beforeEach(async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'pendingClassAssignments', 'kid_ems@x.net'), { classId: 'c_ems' });
        });
    });
    it('a student consumes their own invitation', async () => {
        const db = asKidEms().firestore();
        await assertSucceeds(getDoc(doc(db, 'pendingClassAssignments', 'kid_ems@x.net')));
        await assertSucceeds(deleteDoc(doc(db, 'pendingClassAssignments', 'kid_ems@x.net')));
    });
    it("a student CANNOT read someone else's invitation", async () => {
        await assertFails(getDoc(doc(asKidHms().firestore(), 'pendingClassAssignments', 'kid_ems@x.net')));
    });
    it('staff can create invitations', async () => {
        await assertSucceeds(setDoc(doc(asTeacherEms().firestore(), 'pendingClassAssignments', 'new@x.net'), { classId: 'c_ems' }));
    });
});

// ═══════════════════════ anonymous and unknown ═══════════════════════
describe('unauthenticated and role-less users', () => {
    // NB: unauthenticatedContext() is NOT the same as Firebase Anonymous Auth.
    // An anonymous-auth user HAS a request.auth and passes signedIn(), which is
    // what lets anonymous students read books in game.js. This block covers the
    // genuinely token-less case.
    // ⚠️ THIS USED TO BE ONE `it()` WITH THREE READS IN IT, AND IT FAILED. A
    // bundled assertion cannot tell you WHICH read broke the policy, and this one
    // sat recorded as an open unknown until it was split. Split, the answer is
    // benign: books are public BY DESIGN and the other two are correctly denied.
    // ⚠️ KEEP THEM SEPARATE. Re-bundling them re-creates the unknown.
    it('books are readable WITHOUT a token — deliberate, not a hole', async () => {
        // firestore.rules: match /books/{bookId} { allow read: if true; }
        // A signed-out child must be able to open a book before they have an
        // account; that is the entire anonymous path in game.js. The text of a
        // public-domain book is not the thing being protected here.
        await assertSucceeds(getDoc(doc(asAnon().firestore(), 'books', 'b1')));
    });
    it('a token-less request CANNOT read a student daily log', async () => {
        await assertFails(getDoc(doc(asAnon().firestore(), 'typing_logs', `${KID_EMS}_2026-07-30`)));
    });
    it('a token-less request CANNOT list classes', async () => {
        await assertFails(getDocs(collection(asAnon().firestore(), 'classes')));
    });
    it('a signed-in user with no staff role gets no staff powers', async () => {
        const db = asKidEms().firestore();
        await assertFails(getDoc(doc(db, 'staff', TEACHER_EMS)));
        await assertFails(getDocs(query(collection(db, 'typing_logs'), where('schoolId', '==', EMS))));
    });
});
