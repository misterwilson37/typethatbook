// firestore-rules.test.mjs v1.1.1 — tests for firestore.rules v1.1.0
//
// v1.1.1 — PATH ONLY, Round 17 (Linotype). This file moved from the repo root
//          into tests/, so every source it reads is now `../` rather than `./`.
//          No assertion, threshold or expectation changed.
//
// ⚠️ I COULD NOT RUN THIS. The Firestore emulator downloads its jar from
//    storage.googleapis.com, which isn't reachable from my sandbox. The rules
//    were verified by reading, not by executing. Please run this before you let
//    a colleague near real student data.
//
// ── SETUP (one time) ──
//   npm install --save-dev @firebase/rules-unit-testing firebase mocha
//
// ── RUN ──
//   firebase emulators:exec --only firestore --project demo-ttb \
//     "npx mocha firestore-rules.test.mjs --timeout 10000"
//
// Uses a fake project id (demo-ttb). Nothing touches production.

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
const asClassTeacher = () => env.authenticatedContext(TEACHER_EMS,
    { role: 'teacher', schoolIds: [EMS], readScope: 'own_classes', classIds: ['c_ems'], email: 't_ems@x.net' });
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
        await setDoc(doc(db, 'classes', 'c_ems'), { name: '3rd Period', schoolId: EMS, dailySeconds: 600 });
        await setDoc(doc(db, 'classes', 'c_hms'), { name: '1st Period', schoolId: HMS, dailySeconds: 600 });
        await setDoc(doc(db, 'typing_logs', `${KID_EMS}_2026-07-30`), { uid: KID_EMS, schoolId: EMS, classId: 'c_ems', date: '2026-07-30', seconds: 300 });
        await setDoc(doc(db, 'typing_logs', `${KID_HMS}_2026-07-30`), { uid: KID_HMS, schoolId: HMS, classId: 'c_hms', date: '2026-07-30', seconds: 300 });
        await setDoc(doc(db, 'staff', TEACHER_EMS), { role: 'teacher', schoolIds: [EMS], classIds: ['c_ems'] });
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
        await assertSucceeds(setDoc(doc(db, 'classes', 'c_mine2'),
            { name: 'Mine', schoolId: EMS, teacherUids: [TEACHER_EMS] }));
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
    it('a teacher CAN create a class in their own building', async () => {
        const db = asTeacherEms().firestore();
        await assertSucceeds(setDoc(doc(db, 'classes', 'c_new'), { name: 'Mine', schoolId: EMS }));
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
    it('a request with no auth token at all can read nothing', async () => {
        const db = asAnon().firestore();
        await assertFails(getDoc(doc(db, 'books', 'b1')));
        await assertFails(getDoc(doc(db, 'typing_logs', `${KID_EMS}_2026-07-30`)));
        await assertFails(getDocs(collection(db, 'classes')));
    });
    it('a signed-in user with no staff role gets no staff powers', async () => {
        const db = asKidEms().firestore();
        await assertFails(getDoc(doc(db, 'staff', TEACHER_EMS)));
        await assertFails(getDocs(query(collection(db, 'typing_logs'), where('schoolId', '==', EMS))));
    });
});
