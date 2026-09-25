import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { as, clearFirestore } from './emu.mjs';
await clearFirestore();
const o = as('owner');
const t = d => Timestamp.fromMillis(Date.UTC(2026, 8, d));
let n = 0;
const put = (d) => setDoc(doc(o.db, 'scores', `s${n++}`), d);
for (let i = 0; i < 120; i++) await put({ gameId: 'find-the-center', initials: 'TOP', score: 1000 - i, uid: `top${i}`, timestamp: t(10) });
await put({ gameId: 'find-the-center', initials: 'LOW', score: 3, uid: 'low', timestamp: t(11) });       // rank 121
await put({ gameId: 'find-the-center', initials: '=1+', score: 2, uid: 'evil', timestamp: t(11), flagged: true });
for (const [ini, sec] of [['FST', 42], ['MID', 95], ['SLW', 200]]) await put({ gameId: 'ft-basic-speed', initials: ini, score: sec, uid: `ft${ini}`, timestamp: t(12) });
await setDoc(doc(o.db, 'players', 'low'), { email: 'low.student@stu.test', lastPlayed: t(11) });
await setDoc(doc(o.db, 'players', 'ftFST'), { email: 'fast@stu.test', lastPlayed: t(12) });
await setDoc(doc(o.db, 'site-config', 'main'), { title: 'Spot On!' });
for (const [ini, streak] of [['STK', 7], ['TOP', 12]]) await put({ gameId: 'ft-streak', initials: ini, score: streak, uid: `st${ini}`, timestamp: t(12) });
// Served by browser-smoke-test.py from a second local server that sends NO CORS
// headers — the same as a Firebase Storage bucket with no CORS setting.
const IMG = 'http://127.0.0.1:8766/test.png';
for (let i = 0; i < 3; i++) await setDoc(doc(o.db, 'picture-perfect-images', `img${i}`), { name: `Test ${i}`, imageUrl: IMG });
console.log('seeded', n);
process.exit(0);
