// Emulator helpers: one Firebase app per simulated user, via mockUserToken.
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, setLogLevel } from 'firebase/firestore';
setLogLevel('silent'); // expected denials would otherwise flood the output
import { getStorage, connectStorageEmulator } from 'firebase/storage';

export const PROJECT = 'demo-spoton';
export const ADMIN = { sub: 'admin-jake', email: 'jacob.v.wilson@gmail.com', email_verified: true };
export const ADMIN_UNVERIFIED = { sub: 'admin-fake', email: 'jacob.v.wilson@gmail.com', email_verified: false };
export const student = (uid, email) => ({ sub: uid, email, email_verified: true });
let n = 0;
// token: a claims object, 'owner' (rules bypass, for seeding), or null (signed out)
export function as(token) {
    const app = initializeApp({ projectId: PROJECT, apiKey: 'fake', storageBucket: `${PROJECT}.appspot.com` }, `a${n++}`);
    const db = getFirestore(app);
    connectFirestoreEmulator(db, '127.0.0.1', 8080, token ? { mockUserToken: token } : undefined);
    const st = getStorage(app);
    connectStorageEmulator(st, '127.0.0.1', 9199, token ? { mockUserToken: token } : undefined);
    return { db, st, uid: token && token.sub, email: token && token.email };
}
export async function clearFirestore() {
    await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
}
export async function allowed(p) { try { await p; return true; } catch (e) { return false; } }
export async function denied(p) {
    try { await p; return false; } catch (e) { return e && e.code === 'permission-denied'; }
}
