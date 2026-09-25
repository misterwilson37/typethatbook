// rules-test.mjs — runs the REAL firestore.rules and storage.rules in the emulator,
// and the REAL score-save.js, as students, the admin, and signed-out visitors.
// Run inside: npm run test:emulator
import { collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
         serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getMetadata } from 'firebase/storage';
import { as, ADMIN, ADMIN_UNVERIFIED, student, clearFirestore, allowed, denied } from './emu.mjs';
import { check, section, finish } from './harness.mjs';
import { saveScore, SCORE_FIELDS } from '../score-save.js';

await clearFirestore();
const amy = as(student('amy-uid', 'amy@stu.test'));
const ben = as(student('ben-uid', 'ben@stu.test'));
const admin = as(ADMIN);
const fake = as(ADMIN_UNVERIFIED);
const anon = as(null);
const good = u => ({ gameId: 'find-the-center', initials: 'AMY', score: 900, uid: u, timestamp: serverTimestamp() });

section('The real score-save.js, as a signed-in student');
const id = await saveScore(amy.db, { uid: 'amy-uid', email: 'amy@stu.test' },
    { gameId: 'find-the-center', initials: 'AMY', score: 900, roundCount: 10, averageScore: 90, flagged: false });
const saved = (await getDoc(doc(admin.db, 'scores', id))).data();
check('score saved', !!saved);
check('score holds no email, name or photo', saved && !('email' in saved) && !('displayName' in saved) && !('photoURL' in saved));
check('score is under the student\'s own uid', saved && saved.uid === 'amy-uid');
const player = (await getDoc(doc(admin.db, 'players', 'amy-uid'))).data();
check('private player record written with the sign-in email', player && player.email === 'amy@stu.test' && player.lastPlayed);
let threw = false;
try { await saveScore(amy.db, { uid: 'amy-uid', email: 'amy@stu.test' }, { gameId: 'x', initials: 'A', score: 1, email: 'amy@stu.test' }); }
catch (e) { threw = /not an allowed score field/.test(e.message); }
check('saveScore refuses a field outside SCORE_FIELDS before sending', threw);

section('scores — creating');
check('valid score allowed', await allowed(addDoc(collection(amy.db, 'scores'), good('amy-uid'))));
check('every SCORE_FIELD accepted together', await allowed(addDoc(collection(amy.db, 'scores'), {
    ...good('amy-uid'), flagged: false, roundCount: 10, averageScore: 9, roundsCompleted: 3,
    bestStreak: 2, categoryScores: { a: 1 }, levelCount: 5 })));
for (const extra of ['email', 'displayName', 'photoURL', 'userId', 'anythingElse']) {
    check(`score with "${extra}" DENIED`, await denied(addDoc(collection(amy.db, 'scores'), { ...good('amy-uid'), [extra]: 'x' })));
}
check('score under someone else\'s uid DENIED', await denied(addDoc(collection(amy.db, 'scores'), good('ben-uid'))));
check('4-letter initials DENIED', await denied(addDoc(collection(amy.db, 'scores'), { ...good('amy-uid'), initials: 'ABCD' })));
check('empty initials DENIED', await denied(addDoc(collection(amy.db, 'scores'), { ...good('amy-uid'), initials: '' })));
check('text score DENIED', await denied(addDoc(collection(amy.db, 'scores'), { ...good('amy-uid'), score: '900' })));
check('missing gameId DENIED', await denied(addDoc(collection(amy.db, 'scores'), (({ gameId, ...r }) => r)(good('amy-uid')))));
check('back-dated timestamp DENIED', await denied(addDoc(collection(amy.db, 'scores'), { ...good('amy-uid'), timestamp: Timestamp.fromMillis(0) })));
check('signed-out create DENIED', await denied(addDoc(collection(anon.db, 'scores'), good('amy-uid'))));

section('scores — reading, changing, deleting');
check('signed-out visitor CAN read scores (leaderboard page)', await allowed(getDocs(collection(anon.db, 'scores'))));
check('student update DENIED', await denied(updateDoc(doc(amy.db, 'scores', id), { score: 99999 })));
check('student delete DENIED', await denied(deleteDoc(doc(ben.db, 'scores', id))));
check('admin update allowed', await allowed(updateDoc(doc(admin.db, 'scores', id), { flagged: true })));
check('unverified "admin" email update DENIED', await denied(updateDoc(doc(fake.db, 'scores', id), { flagged: false })));

section('players — the private email record');
const pv = (email) => ({ email, lastPlayed: serverTimestamp() });
check('student writes own record', await allowed(setDoc(doc(ben.db, 'players', 'ben-uid'), pv('ben@stu.test'))));
check('student writes someone else\'s DENIED', await denied(setDoc(doc(ben.db, 'players', 'amy-uid'), pv('ben@stu.test'))));
check('student writes a different email DENIED', await denied(setDoc(doc(ben.db, 'players', 'ben-uid'), pv('fake@stu.test'))));
check('student adds a name field DENIED', await denied(setDoc(doc(ben.db, 'players', 'ben-uid'), { ...pv('ben@stu.test'), displayName: 'Ben' })));
check('student back-dates lastPlayed DENIED', await denied(setDoc(doc(ben.db, 'players', 'ben-uid'), { email: 'ben@stu.test', lastPlayed: Timestamp.fromMillis(0) })));
check('student reads OWN record DENIED', await denied(getDoc(doc(ben.db, 'players', 'ben-uid'))));
check('student reads another\'s DENIED', await denied(getDoc(doc(ben.db, 'players', 'amy-uid'))));
check('student lists players DENIED', await denied(getDocs(collection(ben.db, 'players'))));
check('signed-out read DENIED', await denied(getDocs(collection(anon.db, 'players'))));
check('student deletes own DENIED', await denied(deleteDoc(doc(ben.db, 'players', 'ben-uid'))));
check('admin lists players', await allowed(getDocs(collection(admin.db, 'players'))));
check('unverified "admin" email lists players DENIED', await denied(getDocs(collection(fake.db, 'players'))));
check('admin deletes a record', await allowed(deleteDoc(doc(admin.db, 'players', 'ben-uid'))));

section('game content');
for (const c of ['levels', 'picture-perfect-images', 'site-config', 'bp2-content']) {
    check(`${c}: student write DENIED`, await denied(setDoc(doc(amy.db, c, 't'), { x: 1 })));
    check(`${c}: admin write allowed`, await allowed(setDoc(doc(admin.db, c, 't'), { x: 1 })));
    check(`${c}: signed-out read allowed`, await allowed(getDoc(doc(anon.db, c, 't'))));
}

section('Storage — game-images');
const bytes = new Uint8Array([137, 80, 78, 71]);
const up = async (who, name) => { try { await uploadBytes(ref(who.st, `game-images/${name}`), bytes, { contentType: 'image/png' }); return 'ok'; } catch (e) { return e.code; } };
check('admin upload allowed', (await up(admin, 'a.png')) === 'ok');
check('student upload DENIED', (await up(amy, 'b.png')) === 'storage/unauthorized');
check('unverified "admin" upload DENIED', (await up(fake, 'c.png')) === 'storage/unauthorized');
check('signed-out visitor can read an image', await allowed(getMetadata(ref(anon.st, 'game-images/a.png'))));

finish('rules-test');
process.exit(process.exitCode || 0);
