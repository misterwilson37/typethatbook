// firebase-config.js v1.3.0
//
// v1.3.0 - ⚠️⚠️ ADMIN_EMAILS LIVES HERE NOW, AND THIS IS A 4→1 CONSOLIDATION.
//          The same two-address list was hand-maintained in FOUR files —
//          game.js, learn.js, admin.js and reports.html (as BOOTSTRAP_EMAILS) —
//          which is the twin problem HANDOFF §0.-13.E counted four instances of
//          in a single day. Nobody had drifted yet. That is luck, not design:
//          adding a colleague meant editing four files and the only way to
//          discover you had missed one was a teacher being locked out of one
//          page and not the others.
//          ⚠️ THIS FILE IS THE RIGHT HOME BECAUSE OF WHO ALREADY IMPORTS IT.
//          All four consumers already pull `db`/`auth` from here, so the
//          consolidation cost zero new dependencies — no page had to learn
//          about a module it did not already load. A new shared module would
//          have been a fifth thing to remember to register in versions.js.
//          ⚠️ NOT A SECURITY BOUNDARY, AND IT NEVER WAS. This list ships in
//          client code on every page. firestore.rules and the setStaffRole
//          custom claims are what actually enforce access; this decides what
//          the UI OFFERS. Do not move a real permission behind it.
// v1.2.0 - App Check with reCAPTCHA v3. Sign-up is open to any Google account
//          on earth (deliberately - students self-serve), which made every
//          `allow create` an authenticated, unmetered write target pointed at a
//          personal credit card. firestore.rules v2.2.0 caps what one forged
//          document can cost; App Check is what stops the flood arriving.
//          ⚠️ NOT ENFORCED BY THIS FILE - see the block below.
// v1.1.1 - added CONFIG_VERSION constant so index.html's build banner can read
//          this file's version like every other file's. No functional change.
// v1.1.0 - experimentalForceLongPolling for Safari WebChannel compatibility
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { initializeAppCheck, ReCaptchaV3Provider, getToken }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";

export const CONFIG_VERSION = '1.3.0';

// ═══════════════════════════════════════════════════════════════════════════
// WHO IS STAFF  (v1.3.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️ THE ONLY COPY. game.js, learn.js, admin.js, reports.html and index.html
// all import from here. If you are adding a teacher, this is the one line, and
// tests/admin-list-test.mjs FAILS if a second literal list reappears anywhere
// in the repo — because the failure mode of the old arrangement was silent:
// four lists, one edited, and a colleague who can reach Reports but not the
// admin panel with no error message anywhere to explain it.
//
// ⚠️ A UI GATE, NOT A SECURITY BOUNDARY. This ships in client code on every
// page and anyone can read it in devtools. firestore.rules and the setStaffRole
// custom claims decide what data can actually be fetched; this decides what
// buttons are drawn. Never put a real permission behind it.
export const ADMIN_EMAILS = [
    "jacob.wilson@sumnerk12.net",
    "jacob.v.wilson@gmail.com",
];

// Takes the Firebase user object (or null) rather than an email string, because
// every call site had `currentUser && ADMIN_EMAILS.includes(currentUser.email)`
// written out longhand and one of them is eventually going to forget the null
// check on a signed-out page.
export function isStaffUser(user) {
    return !!(user && user.email && ADMIN_EMAILS.includes(user.email));
}

const firebaseConfig = {
  apiKey: "AIzaSyCV3RVWUwTLKoi_ze-FNCiam4lhggHKHR8",
  authDomain: "typethatbook.firebaseapp.com",
  projectId: "typethatbook",
  storageBucket: "typethatbook.firebasestorage.app",
  messagingSenderId: "213085805139",
  appId: "1:213085805139:web:b7ffdc2b2eab12344a04a6"
};

const app = initializeApp(firebaseConfig);

// ═══════════════════════════════════════════════════════════════════════════
// APP CHECK  (v1.2.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// This site key is PUBLIC BY DESIGN. It ships in client code and is visible in
// devtools on every page - that is how reCAPTCHA works and it is not a leak.
// The paired SECRET key lives only in the Firebase console and must never
// appear in this repo.
//
// ⚠️ UPLOADING THIS FILE CHANGES NOTHING ON ITS OWN, AND THAT IS THE POINT.
// App Check has two independent halves: the client mints tokens (this file) and
// the backend decides whether to require them (Firebase console → App Check →
// APIs → Enforce). Until you click Enforce, tokens are minted and counted and
// ignored. That gap is the whole safety mechanism - it lets you watch the
// verified-request percentage climb on real classroom traffic before anything
// can be rejected. Do not enforce until it is at or near 100%.
//
// ⚠️ THE FAILURE MODE THAT MATTERS IN A SCHOOL: content filters.
// reCAPTCHA needs www.google.com/recaptcha/* and www.gstatic.com/recaptcha/*.
// District web filters block google.com paths more often than you would guess.
// Before enforcement a block is harmless. AFTER enforcement it means every
// Firestore request from that network is rejected - students type normally and
// nothing saves. The write-ahead logs in game.js and learn.js mean the work is
// not LOST (it replays when the block clears), but a period's data would not
// reach a teacher's report that day. If the App Check metrics never reach ~100%
// verified, suspect the filter before suspecting this code.
//
// Failure here is swallowed on purpose. If the reCAPTCHA script cannot load,
// the app must keep working - a typing lesson should not white-screen because
// an anti-abuse provider is unreachable. Once enforcement is on, Firestore will
// reject the requests anyway; there is nothing gained by breaking the page too.
const APPCHECK_SITE_KEY = '6LfzoHItAAAAANsaQMK1tbqmjyvrLcH4g3j-V3St';

let _appCheck = null;
try {
    _appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(APPCHECK_SITE_KEY),
        // Refreshes the token before it expires so a student mid-lesson never
        // stalls on an expired one. Token lifetime itself is a CONSOLE setting
        // (App Check → Apps → your app → TTL), not a code setting - set it to
        // 7 days. Every refresh is a billable reCAPTCHA assessment, so a long
        // TTL is what keeps this comfortably inside the free quota.
        isTokenAutoRefreshEnabled: true
    });
} catch (e) {
    console.warn('App Check init failed - continuing without it. If enforcement ' +
                 'is ON, Firestore requests from this browser will be rejected.', e);
}

// Console helper, because there is no CLI here and the Firebase metrics page
// lags by minutes. Sit at a school machine, open devtools, run
// `await ttbAppCheckStatus()`. A token means the network can reach reCAPTCHA.
// An error means it cannot, and that is your answer before you enforce anything.
window.ttbAppCheckStatus = async function () {
    if (!_appCheck) return { ok: false, reason: 'App Check did not initialize.' };
    try {
        const t = await getToken(_appCheck, /* forceRefresh */ false);
        return { ok: true, tokenPreview: (t.token || '').slice(0, 12) + '…' };
    } catch (e) {
        return { ok: false, reason: e.message || String(e) };
    }
};

// experimentalForceLongPolling fixes Safari's CORS block on Firestore's
// WebChannel streaming transport. Functionally identical for this app.
// ⚠️ Load-bearing. Round 4 considered experimentalAutoDetectLongPolling (faster
// on Chrome and Mac) and rejected it: the upside is latency only, the downside
// is Safari sign-in breaking on a day nobody can debug it. Leave it alone.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const auth = getAuth(app);
export const storage = getStorage(app);
