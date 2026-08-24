// update-gate.js v1.0.1 — FORCE A STALE CLIENT TO RELOAD, FROM THE CONSOLE.
//
// THE PROBLEM THIS EXISTS FOR
//
// Jake ships a fix to game.js. Two days later the old code is still running in
// the building. A Chromebook tab that is never closed never re-requests
// anything, GitHub Pages serves HTML with a ten-minute max-age and the module
// it points at behind an ETag, and there is no service worker to swap. So the
// deploy lands on the server and the classroom keeps running last week's
// arithmetic. Every counting defect this project has ever fixed stays live for
// as long as one tab stays open, and the reports are read against code that
// has been corrected — which is exactly the "kids see one time, I see another"
// complaint.
//
// ⚠️ WHAT THIS CAN AND CANNOT DO — READ THIS BEFORE PROMISING ANYTHING.
//
// It CANNOT reach a tab that is already open and running code from before this
// file existed. Nothing can: a page that is not asking the server a question
// cannot be told an answer. That is a property of the web, not a defect here.
// Those tabs clear when the student reloads, closes the lid overnight, or the
// Chromebook restarts.
//
// What it CAN do is make that the last time it ever happens. From the first
// load that includes this file onward, every client asks once at startup and
// every ten minutes after, and reloads itself when Jake says to. One number in
// the Firebase console, and the building is current within ten minutes.
//
// HOW TO USE IT
//
//   Firestore → settings → appVersion → field `nonce` (number). Increase it
//   by one. That is the whole operation. `note` (string, optional) is shown to
//   the student on the overlay; leave it blank for the plain message.
//
// ⚠️ NO firestore.rules CHANGE IS NEEDED. `match /settings/{docId}` already
// allows read to any signed-in account. Guests cannot read it and therefore
// are never reloaded — deliberate and acceptable: a guest has no graded record
// to keep consistent, and widening that rule is a security decision, not a
// deploy convenience.
//
// ⚠️ WHY A NONCE AND NOT A VERSION STRING. A stale client comparing its own
// version against a required one has to parse and reason about a number it may
// itself be wrong about — and versions.js exists precisely because a cached
// file can misreport itself. A counter needs no interpretation: the client
// stores the last nonce it acted on and reloads when the server's is higher.
// It cannot be confused by a rollback, a hotfix, or a file uploaded out of
// order.
//
// ⚠️ WHY IT NEVER RELOADS MID-SPRINT. A reload during typing is a reload while
// counters are live in memory. The write-ahead log would replay most of it,
// and "most" is not a word that belongs anywhere near a grade. The gate waits
// for IDLE_BEFORE_RELOAD_MS of no keystrokes before acting, re-checking every
// few seconds, and reloads immediately if the tab is hidden (the student has
// already moved on). A student who types continuously for an hour is simply
// not interrupted, which is correct.
//
// ⚠️ WHY IT PRE-FETCHES BEFORE RELOADING. `location.reload()` alone can be
// served the same cached module it already has. Re-requesting each asset with
// `{cache: 'reload'}` forces a network round trip AND replaces the HTTP cache
// entry, so the reload that follows picks up the new file. Without this step
// the gate would reload a client into the identical stale code, forever, on a
// ten-minute timer. That would be worse than doing nothing.
//
// ⚠️ v1.0.1 — THE PRE-FETCH MUST NOT CARRY A QUERY STRING, AND v1.0.0 DID.
// A cache entry is keyed by the WHOLE url. Fetching `game.js?u=7` refreshes the
// entry for `game.js?u=7` — a url nothing ever requests — and leaves the entry
// for `game.js`, which is what game.html's script tag actually asks for,
// exactly as stale as it was. The gate would have reloaded the building into
// the same old code and reported success. The cache-busting is done by
// `{cache: 'reload'}` itself; the query string was not just unnecessary, it
// defeated the whole mechanism. The `?u=` on the PAGE url below is a different
// thing and is still wanted: it forces the html document itself to be
// re-requested rather than served from the back/forward cache.
//
// ⚠️ THIS FILE IS LOADED FROM ITS OWN <script type="module"> TAG IN game.html
// AND learn.html, NOT IMPORTED BY game.js OR learn.js. Two reasons, both
// load-bearing. First, a separate module graph means a 404 on this file cannot
// stop the typing page from booting — §1's "a missing module renders nothing
// at all" does not apply across script tags. Second, it means this shipped
// without a single line changing in game.js or learn.js, which is the standing
// rule while the counting code is under repair.

export const UPDATE_GATE_VERSION = "1.0.1";

import { db, auth } from "./firebase-config.js";
import { doc, getDoc } from "./read-meter.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const NONCE_KEY               = "ttb_update_nonce";
const POLL_INTERVAL_MS        = 600000;   // 10 minutes
const IDLE_BEFORE_RELOAD_MS   = 8000;     // no keystrokes for this long
const IDLE_RECHECK_MS         = 3000;     // how often to retry while they type

// Every same-origin asset a stale tab could be holding. style.css and the two
// shells are here because a markup or layout fix is just as capable of being
// cached as a logic one.
const ASSETS = [
    "game.js", "learn.js", "style.css", "hud.js", "session-log.js",
    "stats-wal.js", "keyboard.js", "variety-floor.js", "versions.js",
    "firebase-config.js", "adventure-renderer.js",
    "game.html", "learn.html", "index.html",
];

let lastKeyAt = 0;
let reloading = false;
let pollTimer = null;

document.addEventListener("keydown", () => { lastKeyAt = Date.now(); }, true);

function storedNonce() {
    const raw = localStorage.getItem(NONCE_KEY);
    const n = raw === null ? null : parseInt(raw, 10);
    return (n === null || isNaN(n)) ? null : n;
}

function showOverlay(note) {
    if (document.getElementById("ttb-update-overlay")) return;
    const el = document.createElement("div");
    el.id = "ttb-update-overlay";
    el.setAttribute("style", [
        "position:fixed", "inset:0", "z-index:99999",
        "background:rgba(10,10,10,0.94)", "color:#eee",
        "font-family:'Courier New',monospace",
        "display:flex", "flex-direction:column",
        "align-items:center", "justify-content:center",
        "gap:14px", "text-align:center", "padding:24px",
    ].join(";"));
    const safeNote = note ? String(note).slice(0, 200) : "";
    const h = document.createElement("div");
    h.setAttribute("style", "font-size:1.3rem;color:#4B9CD3;letter-spacing:1px;");
    h.textContent = "Updating TypeThatBook…";
    const p = document.createElement("div");
    p.setAttribute("style", "font-size:0.9rem;color:#aaa;max-width:34em;line-height:1.6;");
    // textContent, not innerHTML — `note` is a field an admin types into a
    // console and it lands on ninety student screens. Not a place for markup.
    p.textContent = safeNote ||
        "Your work is saved. This page will reload in a moment with the newest version.";
    el.appendChild(h);
    el.appendChild(p);
    document.body.appendChild(el);
}

// Replace the cache entry for everything, then reload. Failures are ignored on
// purpose: a 404 on an asset this page does not use (learn.js on the Library
// page, and vice versa) is expected and must not stop the reload.
async function refreshAndReload(nonce, note) {
    if (reloading) return;
    reloading = true;
    showOverlay(note);

    // Record the nonce BEFORE reloading. If the fetches or the reload fail in
    // some way we have not thought of, the worst case is one missed update —
    // not a tab that reloads itself every ten minutes forever, which would be
    // a denial of service on a child's lesson.
    try { localStorage.setItem(NONCE_KEY, String(nonce)); } catch (e) { /* private mode */ }

    // ⚠️ NO QUERY STRING HERE. See the v1.0.1 note in the header — the url
    // fetched must be byte-identical to the url the page will request after the
    // reload, or the refreshed cache entry is one nothing will ever look up.
    await Promise.allSettled(
        ASSETS.map(a => fetch(a, { cache: "reload" }))
    );

    // Preserve every existing parameter — ?book= decides which book loads, and
    // dropping it would land the student in the default book instead of theirs.
    const params = new URLSearchParams(window.location.search);
    params.set("u", String(nonce));
    window.location.replace(
        window.location.pathname + "?" + params.toString() + window.location.hash
    );
}

function reloadWhenIdle(nonce, note) {
    if (reloading) return;
    const idleEnough = Date.now() - lastKeyAt > IDLE_BEFORE_RELOAD_MS;
    if (document.hidden || idleEnough) {
        refreshAndReload(nonce, note);
    } else {
        setTimeout(() => reloadWhenIdle(nonce, note), IDLE_RECHECK_MS);
    }
}

async function checkForUpdate() {
    if (reloading) return;
    let data;
    try {
        const snap = await getDoc(doc(db, "settings", "appVersion"));
        if (!snap.exists()) return;          // not set up yet — do nothing, quietly
        data = snap.data();
    } catch (e) {
        // A guest, an offline Chromebook, a rules change. Never surface this to
        // a student and never block the page on it.
        console.warn("[update-gate] check skipped:", e && e.message);
        return;
    }

    const serverNonce = typeof data.nonce === "number" ? data.nonce : null;
    if (serverNonce === null) return;

    const mine = storedNonce();
    if (mine === null) {
        // First run on this device. This client is, by definition, already
        // running the code that shipped with this file — reloading it would
        // teach nothing and cost a lesson interruption. Adopt and move on.
        try { localStorage.setItem(NONCE_KEY, String(serverNonce)); } catch (e) { /* ignore */ }
        return;
    }
    if (serverNonce > mine) reloadWhenIdle(serverNonce, data.note);
}

onAuthStateChanged(auth, (user) => {
    if (!user) return;                        // guests are not gated; see the header
    checkForUpdate();
    if (pollTimer === null) {
        pollTimer = setInterval(checkForUpdate, POLL_INTERVAL_MS);
    }
});

// A tab that has been hidden for hours checks the moment it comes back, rather
// than waiting out the remainder of a ten-minute timer it slept through.
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkForUpdate();
});

console.log("[update-gate] v" + UPDATE_GATE_VERSION + " armed");
