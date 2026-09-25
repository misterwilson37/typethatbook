// purge-retention-test.mjs — runs the REAL privacy-tools.js (the code admin.html
// calls) against seeded data in the emulator, under the real rules, as the admin.
// Two-student checks throughout: the wrong student must never lose anything.
import { collection, doc, setDoc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { as, ADMIN, student, clearFirestore, denied } from './emu.mjs';
import { check, section, finish } from './harness.mjs';
import { RETENTION_MONTHS, LEGACY_PERSONAL_FIELDS, planLegacyScrub, applyLegacyScrub,
         planStudentDelete, applyStudentDelete, planRetention, applyRetention,
         listImageHosts, retentionCutoff, planImageMoves, moveImage, hostPictureInSpotOn,
         isSpotOnHosted, expiryDate } from '../privacy-tools.js';

const NOW = Date.UTC(2026, 8, 24);
const ago = months => { const d = new Date(NOW); d.setMonth(d.getMonth() - months); return Timestamp.fromMillis(d.getTime()); };

await clearFirestore();
const owner = as('owner');
const admin = as(ADMIN);
const kid = as(student('kid-uid', 'kid@stu.test'));
const legacy = (uid, email, months, extra = {}) => ({
    gameId: 'find-the-center', initials: uid.slice(0, 3).toUpperCase(), score: 500,
    uid, email, displayName: `Name ${uid}`, photoURL: 'https://lh3.googleusercontent.com/x',
    timestamp: ago(months), ...extra });
const seed = { // id -> data
    a1: legacy('ua', 'a@stu.test', 1), a2: legacy('ua', 'a@stu.test', 3),
    b1: (({ uid, ...r }) => ({ ...r, userId: 'ub' }))(legacy('ub', 'b@stu.test', 2)), // old "userId" games
    p1: { gameId: 'picture-perfect', initials: 'PPP', score: 7, uid: 'up', timestamp: ago(1) }, // never had email
    c1: legacy('uc', 'c@stu.test', 30), c2: legacy('uc', 'c@stu.test', 31),
    d1: legacy('ud', 'd@stu.test', 20),
    e1: { gameId: 'sweet-spot', initials: 'EEE', score: 3, uid: 'ue', timestamp: ago(1) },
    f1: legacy('uf', 'f@stu.test', 2), f2: legacy('uf', 'f@stu.test', 4),
    x1: (({ uid, ...r }) => r)(legacy('ux', 'x@stu.test', 2)),   // email, no account ID at all
    z1: { gameId: 'sweet-spot', initials: 'ZZZ', score: 1, uid: 'uz' } // no timestamp
};
for (const [id, d] of Object.entries(seed)) await setDoc(doc(owner.db, 'scores', id), d);
// E: old player record, but a RECENT score — must count as active.
await setDoc(doc(owner.db, 'players', 'ue'), { email: 'e@stu.test', lastPlayed: ago(30) });
await setDoc(doc(owner.db, 'levels', 'L1'), { imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/a.png' });
await setDoc(doc(owner.db, 'picture-perfect-images', 'P1'), { name: 'Pier', imageUrl: 'https://images.pexels.com/photos/1/a.jpg',
    sourceUrl: 'https://www.pexels.com/photo/1/' });   // sourceUrl: a credit link no game loads
await setDoc(doc(owner.db, 'picture-perfect-images', 'P2'), { name: 'Cat', imageUrl: 'https://images.pexels.com/photos/2/b.jpg' });
await setDoc(doc(owner.db, 'bp2-content', 'B1'), { name: 'Book', imageUrl: 'https://www.gutenberg.org/cache/epub/1/images/c.jpg', text: 'x' });

const score = async id => (await getDoc(doc(admin.db, 'scores', id))).data();
const playerRec = async uid => (await getDoc(doc(admin.db, 'players', uid))).data();
const countScores = async () => (await getDocs(collection(admin.db, 'scores'))).size;

section('The tools are admin-only');
check('student cannot run the cleanup plan', await denied(planLegacyScrub(kid.db)));
check('student cannot run the retention plan', await denied(planRetention(kid.db, NOW)));
check('student cannot look a student up by email', await denied(planStudentDelete(kid.db, 'a@stu.test')));

section('Delete a student BEFORE the cleanup (email still on the scores)');
let before = await countScores();
let plan = await planStudentDelete(admin.db, '  F@stu.test ');
check('found by legacy email, case/space-insensitive', plan.scoreIds.length === 2, JSON.stringify(plan));
await applyStudentDelete(admin.db, plan);
check('both of F\'s scores gone', !(await score('f1')) && !(await score('f2')));
check('exactly two records removed', (await countScores()) === before - 2);

section('Legacy cleanup');
plan = await planLegacyScrub(admin.db);
check('7 records to clean (A×2, B, C×2, D, X)', plan.scoresToClean.length === 7, plan.scoresToClean.length);
check('4 emails to move (A, B, C, D)', plan.playersToWrite.length === 4, plan.playersToWrite.length);
check('1 email with no account to hang it on', plan.emailWithNoAccount === 1);
await applyLegacyScrub(admin.db, plan);
const all = (await getDocs(collection(admin.db, 'scores'))).docs.map(d => d.data());
check('NO score carries email, name, photo or userId', all.every(s => LEGACY_PERSONAL_FIELDS.every(f => !(f in s))));
check('initials and scores untouched', (await score('a1')).initials === 'UA' && (await score('a1')).score === 500);
check('old "userId" score now has uid', (await score('b1')).uid === 'ub');
const pa = await playerRec('ua');
check('A\'s email moved to the private record', pa && pa.email === 'a@stu.test');
check('A\'s lastPlayed = newest score (1 month ago)', pa && pa.lastPlayed.toMillis() === ago(1).toMillis());
check('E\'s existing record not overwritten', (await playerRec('ue')).email === 'e@stu.test');
check('running it again finds nothing', (await planLegacyScrub(admin.db)).scoresToClean.length === 0);

section('Delete a student AFTER the cleanup (email only in players)');
before = await countScores();
plan = await planStudentDelete(admin.db, 'a@stu.test');
check('found A\'s 2 scores and 1 record', plan.scoreIds.length === 2 && plan.playerIds.length === 1);
await applyStudentDelete(admin.db, plan);
check('A\'s scores and record gone', !(await score('a1')) && !(await score('a2')) && !(await playerRec('ua')));
check('exactly two scores removed', (await countScores()) === before - 2);
check('B untouched (score and record)', !!(await score('b1')) && (await playerRec('ub')).email === 'b@stu.test');
check('unknown email finds nothing', (await planStudentDelete(admin.db, 'nobody@stu.test')).scoreIds.length === 0);

section(`Retention (${RETENTION_MONTHS} months)`);
check('cutoff is 24 months before now', retentionCutoff(NOW) === ago(24).toMillis());
plan = await planRetention(admin.db, NOW);
const ids = plan.expired.map(e => e.uid).sort();
check('only C (30 months) is expired', JSON.stringify(ids) === '["uc"]', JSON.stringify(ids));
check('D (20 months) is kept', !ids.includes('ud'));
check('E kept: old record but a recent score (every activity source counts)', !ids.includes('ue'));
check('undated score never auto-expired, and reported', !ids.includes('uz') && plan.undatedScores === 1);
check('C listed with its email for the admin to see', plan.expired[0].email === 'c@stu.test');
check('next to expire = D, the least-recently-active student still in date', plan.next && plan.next.uid === 'ud', JSON.stringify(plan.next));
check('D is due 24 months after its last score (4 months from now)',
      plan.next && plan.next.expiresMs === expiryDate(ago(20).toMillis()) && plan.next.expiresMs === ago(-4).toMillis());
await applyRetention(admin.db, plan);
const c1 = await score('c1');
check('C\'s scores still on the board', !!c1 && !!(await score('c2')));
check('...with initials and score kept', c1.initials === 'UC' && c1.score === 500);
check('...but attached to no account', !('uid' in c1));
check('C\'s email record deleted', !(await playerRec('uc')));
check('D untouched', (await score('d1')).uid === 'ud' && (await playerRec('ud')).email === 'd@stu.test');
check('running it again expires nobody', (await planRetention(admin.db, NOW)).expired.length === 0);

section('Picture sources');
let hosts = (await listImageHosts(admin.db)).map(h => h.host);
check('Firebase Storage listed', hosts.includes('firebasestorage.googleapis.com'));
check('Pexels and Gutenberg listed', hosts.includes('images.pexels.com') && hosts.includes('www.gutenberg.org'));
check('a credit link (sourceUrl) is NOT counted — no game loads it', !hosts.includes('www.pexels.com'));
check('Firebase Storage URL counts as SpotOn-hosted', isSpotOnHosted('https://firebasestorage.googleapis.com/v0/b/x/o/a.png'));
const moves = await planImageMoves(admin.db);
check('3 outside pictures to move (2 Picture Perfect, 1 Balanced II), not the Sweet Spot one',
      moves.length === 3 && !moves.some(m => m.collection === 'levels'), JSON.stringify(moves.map(m => m.id)));

section('Moving a picture into Storage (real emulator upload)');
const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' });
const p1 = moves.find(m => m.id === 'P1');
const newUrl = await moveImage(admin.db, admin.st, p1, png);
const p1doc = (await getDoc(doc(admin.db, 'picture-perfect-images', 'P1'))).data();
check('record now points at the uploaded copy', p1doc.imageUrl === newUrl && newUrl.includes('game-images%2Fmoved%2Fpicture-perfect-images-P1.png'), newUrl);
check('original address kept as a credit', p1doc.originalImageUrl === 'https://images.pexels.com/photos/1/a.jpg');
check('other fields untouched', p1doc.name === 'Pier' && p1doc.sourceUrl === 'https://www.pexels.com/photo/1/');
check('P1 no longer loads from Pexels', !(await planImageMoves(admin.db)).some(m => m.url.includes('photos/1/')));
let studentMove = '';
try { await moveImage(kid.db, kid.st, moves.find(m => m.id === 'P2'), png); } catch (e) { studentMove = e.code; }
check('a student cannot move a picture', studentMove === 'storage/unauthorized', studentMove);
let changedErr = '';
await setDoc(doc(owner.db, 'bp2-content', 'B1'), { name: 'Book', imageUrl: 'https://www.gutenberg.org/NEW.jpg', text: 'x' });
try { await moveImage(admin.db, admin.st, moves.find(m => m.id === 'B1'), png); } catch (e) { changedErr = e.message; }
check('a record changed mid-move is left alone', /changed while moving/.test(changedErr)
      && (await getDoc(doc(admin.db, 'bp2-content', 'B1'))).data().imageUrl === 'https://www.gutenberg.org/NEW.jpg');

section('Copy-in right after an admin save');
const okFetch = async () => new Response(png, { status: 200 });
check('outside picture copied in', (await hostPictureInSpotOn(admin.db, admin.st, 'picture-perfect-images', 'P2', okFetch)) === 'moved');
check('a Firebase-hosted picture is left alone (no download attempted)',
      (await hostPictureInSpotOn(admin.db, admin.st, 'levels', 'L1', async () => { throw new Error('should not fetch'); })) === 'already');
const htmlFetch = async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } });
let notPic = '';
try { await hostPictureInSpotOn(admin.db, admin.st, 'bp2-content', 'B1', htmlFetch); } catch (e) { notPic = e.message; }
check('a web page instead of a picture is refused, record untouched', /not a picture/.test(notPic)
      && (await getDoc(doc(admin.db, 'bp2-content', 'B1'))).data().imageUrl === 'https://www.gutenberg.org/NEW.jpg');
const blocked = async () => { throw new TypeError('Failed to fetch'); };
let corsErr = '';
try { await hostPictureInSpotOn(admin.db, admin.st, 'bp2-content', 'B1', blocked); } catch (e) { corsErr = e.message; }
check('a blocked download (CORS) throws, so admin shows the manual-upload fallback', /Failed to fetch/.test(corsErr));

finish('purge-retention-test');
process.exit(process.exitCode || 0);
