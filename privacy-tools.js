// privacy-tools.js v1.2.0 — the admin page's privacy tools, kept out of admin.html
// so tests/purge-retention-test.mjs can run THIS EXACT FILE against a real
// Firestore emulator. Written by Figgins, Sept 2026 (privacy round).
//
// Four tools, each in two halves — a PLAN (reads only, nothing changes) and an
// APPLY (does exactly what the plan listed). admin.html always shows the plan and
// asks Jake to confirm before calling apply.
//
//   1. Legacy cleanup   — one time. Moves each email off the public score records into
//                         the private players/{uid} record, then strips email, name,
//                         photo and the old "userId" field off every score.
//   2. Delete a student — on a school/parent request. Everything: scores AND the
//                         email link. (The sign-in account itself is deleted in the
//                         Firebase console — no web page can delete someone else's.)
//   3. Retention        — quarterly. A student with no saved score for 24 months has
//                         their email link deleted and their scores made anonymous:
//                         initials and scores stay on the boards, attached to nobody.
//   4. Picture sources  — which websites the games' pictures load from (reads only),
//                         and (v1.1.0) moving outside pictures into SpotOn's own Firebase
//                         Storage, so students' computers never contact those websites.
//
// ⚠️ ORDER MATTERS, and is the same in every tool: the step that would lose the only
// copy of something runs LAST, so a run interrupted halfway (tab closed, network
// drop) leaves everything findable and the tool is safe to run again.

import { collection, getDocs, getDoc, doc, query, where, writeBatch, deleteField, updateDoc, Timestamp }
    from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL }
    from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

export const PRIVACY_TOOLS_VERSION = '1.2.0';

// ⚠️ THE retention period. privacy.html and SECURITY.md state it in words;
// tests/privacy-promises-test.mjs checks all three agree.
export const RETENTION_MONTHS = 24;

// Fields that older versions of the games put on public score records.
export const LEGACY_PERSONAL_FIELDS = ['email', 'displayName', 'photoURL', 'userId'];

const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch; leave headroom.

// ---------- helpers ----------
function ownerOf(score) { return score.uid || score.userId || null; }
function millis(t) { return t && typeof t.toMillis === 'function' ? t.toMillis() : null; }
function normEmail(e) { return String(e || '').trim().toLowerCase(); }

async function readAll(db, name) {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Runs a list of (batch) => void steps, BATCH_LIMIT per commit, in order.
async function commitSteps(db, steps) {
    for (let i = 0; i < steps.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        steps.slice(i, i + BATCH_LIMIT).forEach(step => step(batch));
        await batch.commit();
    }
    return steps.length;
}

// The day a student last active on lastMs becomes due for expiry (v1.2.0).
export function expiryDate(lastMs) {
    const d = new Date(lastMs);
    d.setMonth(d.getMonth() + RETENTION_MONTHS);
    return d.getTime();
}

export function retentionCutoff(nowMs = Date.now()) {
    const d = new Date(nowMs);
    d.setMonth(d.getMonth() - RETENTION_MONTHS);
    return d.getTime();
}

// ============================================================
// 1. LEGACY CLEANUP (one time)
// ============================================================
export async function planLegacyScrub(db) {
    const scores = await readAll(db, 'scores');
    const players = new Map((await readAll(db, 'players')).map(p => [p.id, p]));

    const dirty = scores.filter(s => LEGACY_PERSONAL_FIELDS.some(f => f in s));
    const links = new Map();          // uid -> { email, lastMs }
    let emailWithNoAccount = 0;       // an email with no account ID to hang it on

    for (const s of dirty) {
        const uid = ownerOf(s);
        const email = normEmail(s.email);
        if (!email) continue;
        if (!uid) { emailWithNoAccount++; continue; }
        const ms = millis(s.timestamp) ?? 0;
        const cur = links.get(uid) || { email, lastMs: -1 };
        if (ms >= cur.lastMs) { cur.email = email; cur.lastMs = ms; }  // newest score's email
        links.set(uid, cur);
    }
    // Never move a lastPlayed BACKWARD for a student who already has a record.
    for (const [uid, link] of links) {
        const existing = millis(players.get(uid)?.lastPlayed);
        if (existing && existing > link.lastMs) link.lastMs = existing;
    }
    return {
        scoresToClean: dirty.map(s => ({ id: s.id, uid: ownerOf(s) })),
        playersToWrite: [...links].map(([uid, l]) => ({ uid, email: l.email, lastMs: l.lastMs })),
        emailWithNoAccount
    };
}

export async function applyLegacyScrub(db, plan) {
    // Step 1 — copy every email to its private record FIRST.
    const playerSteps = plan.playersToWrite.map(p => batch =>
        batch.set(doc(db, 'players', p.uid),
                  { email: p.email, lastPlayed: Timestamp.fromMillis(p.lastMs) }));
    await commitSteps(db, playerSteps);

    // Step 2 — only then strip the public copies.
    const scoreSteps = plan.scoresToClean.map(s => batch => {
        const change = {};
        LEGACY_PERSONAL_FIELDS.forEach(f => { change[f] = deleteField(); });
        if (s.uid) change.uid = s.uid;       // "userId" scores become "uid" scores
        batch.update(doc(db, 'scores', s.id), change);
    });
    await commitSteps(db, scoreSteps);
    return { playersWritten: playerSteps.length, scoresCleaned: scoreSteps.length };
}

// ============================================================
// 2. DELETE A STUDENT (on request)
// ============================================================
export async function planStudentDelete(db, emailInput) {
    const email = normEmail(emailInput);
    if (!email) throw new Error('No email given');

    const uids = new Set();
    const playerSnap = await getDocs(query(collection(db, 'players'), where('email', '==', email)));
    playerSnap.docs.forEach(d => uids.add(d.id));
    // Scores saved before the legacy cleanup still carry the email directly.
    const legacySnap = await getDocs(query(collection(db, 'scores'), where('email', '==', email)));
    legacySnap.docs.forEach(d => { const o = ownerOf(d.data()); if (o) uids.add(o); });

    const scoreIds = new Set(legacySnap.docs.map(d => d.id));
    for (const uid of uids) {
        for (const field of ['uid', 'userId']) {
            const snap = await getDocs(query(collection(db, 'scores'), where(field, '==', uid)));
            snap.docs.forEach(d => scoreIds.add(d.id));
        }
    }
    return { email, uids: [...uids], playerIds: playerSnap.docs.map(d => d.id), scoreIds: [...scoreIds] };
}

export async function applyStudentDelete(db, plan) {
    // Scores first; the email link LAST, so an interrupted run can be found and repeated.
    await commitSteps(db, plan.scoreIds.map(id => batch => batch.delete(doc(db, 'scores', id))));
    await commitSteps(db, plan.playerIds.map(id => batch => batch.delete(doc(db, 'players', id))));
    return { scoresDeleted: plan.scoreIds.length, playersDeleted: plan.playerIds.length };
}

// ============================================================
// 3. RETENTION (quarterly)
// ============================================================
// "Last active" = the later of the student's newest saved score and their players
// record's lastPlayed. Saving a score is the only thing SpotOn records, so it is the
// only activity there is to count.
export async function planRetention(db, nowMs = Date.now()) {
    const cutoff = retentionCutoff(nowMs);
    const scores = await readAll(db, 'scores');
    const players = await readAll(db, 'players');

    const byUid = new Map();   // uid -> { lastMs, scoreIds: [], email }
    const entry = uid => {
        if (!byUid.has(uid)) byUid.set(uid, { lastMs: null, scoreIds: [], email: '' });
        return byUid.get(uid);
    };
    let undated = 0;
    for (const s of scores) {
        const uid = ownerOf(s);
        if (!uid) continue;                       // already anonymous
        const e = entry(uid);
        e.scoreIds.push(s.id);
        const ms = millis(s.timestamp);
        if (ms === null) { undated++; continue; }
        e.lastMs = Math.max(e.lastMs ?? 0, ms);
    }
    for (const p of players) {
        const e = entry(p.id);
        e.email = p.email || '';
        const ms = millis(p.lastPlayed);
        if (ms !== null) e.lastMs = Math.max(e.lastMs ?? 0, ms);
    }
    const expired = [];
    for (const [uid, e] of byUid) {
        // No date at all → never expired automatically (listed for a human instead).
        if (e.lastMs !== null && e.lastMs < cutoff) {
            expired.push({ uid, email: e.email, lastMs: e.lastMs, scoreIds: e.scoreIds,
                           hasPlayerRecord: players.some(p => p.id === uid) });
        }
    }
    expired.sort((a, b) => a.lastMs - b.lastMs);
    // v1.2.0: the NEXT student due — the least-recently-active one not yet expired —
    // so the admin knows the first date the check can find anything new.
    let next = null;
    for (const [uid, e] of byUid) {
        if (e.lastMs === null || e.lastMs < cutoff) continue;
        if (!next || e.lastMs < next.lastMs) next = { uid, email: e.email, lastMs: e.lastMs };
    }
    if (next) next.expiresMs = expiryDate(next.lastMs);
    return { cutoffMs: cutoff, expired, undatedScores: undated, next };
}

export async function applyRetention(db, plan) {
    // Make each expired student's scores anonymous (initials and score stay)…
    const scoreSteps = [];
    for (const s of plan.expired) {
        for (const id of s.scoreIds) {
            scoreSteps.push(batch => {
                const change = { uid: deleteField() };
                LEGACY_PERSONAL_FIELDS.forEach(f => { change[f] = deleteField(); });
                batch.update(doc(db, 'scores', id), change);
            });
        }
    }
    await commitSteps(db, scoreSteps);
    // …then delete the email link LAST.
    const playerSteps = plan.expired.filter(s => s.hasPlayerRecord)
        .map(s => batch => batch.delete(doc(db, 'players', s.uid)));
    await commitSteps(db, playerSteps);
    return { studentsExpired: plan.expired.length, scoresAnonymized: scoreSteps.length,
             playersDeleted: playerSteps.length };
}

// ============================================================
// 4. PICTURE SOURCES (v1.1.0)
// ============================================================
// The one field per collection that the games actually load into a student's browser.
// Other URL fields (a Picture Perfect "sourceUrl" credit, a moved picture's
// "originalImageUrl") are stored but never loaded by a game, so they don't count.
export const IMAGE_FIELDS = {
    'levels': 'imageUrl',                    // Sweet Spot
    'picture-perfect-images': 'imageUrl',    // Picture Perfect
    'bp2-content': 'imageUrl'                // Balanced Placement II
};

function hostOf(url) {
    if (typeof url !== 'string' || !url) return null;
    if (url.startsWith('data:')) return '(stored inside the database)';
    try { return new URL(url).host; } catch { return null; }
}
// Google's own Firebase Storage — the same company that already runs SpotOn's database.
export function isSpotOnHosted(url) {
    const h = hostOf(url);
    return h === '(stored inside the database)' || h === 'firebasestorage.googleapis.com'
        || (!!h && h.endsWith('.firebasestorage.app'));
}

// Every website a game loads a picture from, with how many pictures.
export async function listImageHosts(db) {
    const hosts = {};
    for (const [name, field] of Object.entries(IMAGE_FIELDS)) {
        for (const d of await readAll(db, name)) {
            const host = hostOf(d[field]);
            if (!host) continue;
            hosts[host] = hosts[host] || { count: 0, collections: new Set() };
            hosts[host].count++;
            hosts[host].collections.add(name);
        }
    }
    return Object.entries(hosts)
        .map(([host, h]) => ({ host, count: h.count, collections: [...h.collections],
                               spotOn: host === '(stored inside the database)' || host === 'firebasestorage.googleapis.com'
                                       || host.endsWith('.firebasestorage.app') }))
        .sort((a, b) => b.count - a.count);
}

// Every picture still loaded from another website.
export async function planImageMoves(db) {
    const items = [];
    for (const [name, field] of Object.entries(IMAGE_FIELDS)) {
        for (const d of await readAll(db, name)) {
            const url = d[field];
            if (typeof url === 'string' && url && !isSpotOnHosted(url)) {
                items.push({ collection: name, id: d.id, url, name: d.name || d.id });
            }
        }
    }
    return items;
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg' };

// Download a picture in the admin's browser. Fails if the other website doesn't allow
// it (CORS) — admin.html then offers a manual upload for that one picture instead.
export async function fetchImage(url, fetchImpl = fetch) {
    const resp = await fetchImpl(url);
    if (!resp.ok) throw new Error(`download failed (HTTP ${resp.status})`);
    const blob = await resp.blob();
    if (!/^image\//.test(blob.type)) throw new Error(`not a picture (${blob.type || 'unknown type'})`);
    return blob;
}

// Upload the picture to Storage FIRST, then point the record at it. If the record
// changed in the meantime, it is left alone. The old address is kept as
// originalImageUrl (a credit, never loaded by a game).
export async function moveImage(db, storage, item, blob) {
    const field = IMAGE_FIELDS[item.collection];
    if (!field) throw new Error(`not a picture collection: ${item.collection}`);
    const ext = EXT[blob.type] || 'img';
    const fileRef = ref(storage, `game-images/moved/${item.collection}-${item.id}.${ext}`);
    await uploadBytes(fileRef, blob, { contentType: blob.type || 'application/octet-stream' });
    const newUrl = await getDownloadURL(fileRef);
    const now = (await getDoc(doc(db, item.collection, item.id))).data();
    if (!now || now[field] !== item.url) throw new Error('the record changed while moving — run it again');
    await updateDoc(doc(db, item.collection, item.id), { [field]: newUrl, originalImageUrl: item.url });
    return newUrl;
}

// Used right after admin.html saves a picture record: if its picture is on another
// website, copy it in. Returns 'already' | 'moved'. Throws if it couldn't be copied.
export async function hostPictureInSpotOn(db, storage, collectionName, id, fetchImpl = fetch) {
    const field = IMAGE_FIELDS[collectionName];
    const data = (await getDoc(doc(db, collectionName, id))).data();
    const url = data && data[field];
    if (!url || isSpotOnHosted(url)) return 'already';
    const blob = await fetchImage(url, fetchImpl);
    await moveImage(db, storage, { collection: collectionName, id, url, name: data.name || id }, blob);
    return 'moved';
}
