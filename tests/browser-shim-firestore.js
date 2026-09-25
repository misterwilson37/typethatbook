export * from "https://www.gstatic.com/firebasejs/11.6.1/REAL-firebase-firestore.js";
import { getFirestore as realGet, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/REAL-firebase-firestore.js";
const wired = new WeakSet();
export function getFirestore(app, ...rest) {
  const db = realGet(app, ...rest);
  if (!wired.has(db)) { connectFirestoreEmulator(db, '127.0.0.1', 8080, window.__TOKEN__ ? { mockUserToken: window.__TOKEN__ } : undefined); wired.add(db); }
  return db;
}
