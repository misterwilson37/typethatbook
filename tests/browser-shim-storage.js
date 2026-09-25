export * from "https://www.gstatic.com/firebasejs/11.6.1/REAL-firebase-storage.js";
import { getStorage as realGet, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/REAL-firebase-storage.js";
const wired = new WeakSet();
export function getStorage(app, ...rest) {
  const st = realGet(app, ...rest);
  if (!wired.has(st)) { connectStorageEmulator(st, '127.0.0.1', 9199, window.__TOKEN__ ? { mockUserToken: window.__TOKEN__ } : undefined); wired.add(st); }
  return st;
}
