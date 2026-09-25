export * from "https://www.gstatic.com/firebasejs/11.6.1/REAL-firebase-auth.js";
export function onAuthStateChanged(auth, cb) { setTimeout(() => cb(window.__USER__ || null), 50); return () => {}; }
export async function signInWithPopup() { return { user: window.__USER__ }; }
export async function signOut() { window.__SIGNED_OUT__ = true; }
