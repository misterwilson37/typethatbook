// firebase-config.js v1.1.0 — Spot On! Games
// Project: spot-on-games
// Loaded as an ES module by all games, admin, index, and leaderboard.
//
// v1.1.0 (Figgins, Sept 2026 privacy round): removed measurementId. SpotOn never
// turned Google Analytics on (no page calls getAnalytics), so the ID did nothing —
// but it made "SpotOn uses no analytics" something a reviewer had to take on faith.
// tests/privacy-promises-test.mjs fails if it, or any analytics call, comes back.

export const firebaseConfig = {
  apiKey: "AIzaSyDwfaJB8LVa6NX2kOPI7j4pCmQyiH3H4Lc",
  authDomain: "spot-on-games.firebaseapp.com",
  projectId: "spot-on-games",
  storageBucket: "spot-on-games.firebasestorage.app",
  messagingSenderId: "77896599950",
  appId: "1:77896599950:web:3df9ec887881b57ba13cdf"
};
