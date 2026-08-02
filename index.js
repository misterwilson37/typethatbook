// index.js v1.0.0 — Cloud Functions source. Only generatePractice() is
// deployed. NOT deployable from this repo: it needs `firebase deploy`, and
// Jake has no CLI. Treat this file as the record of what is running, and
// bump this line whenever the deployed function is changed.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const DAILY_LIMIT = 5;

// v1.5 — Staff management for the admin UI. Adds building_admin as a third role,
//        a PER-PERSON readScope ('own_classes' | 'building') that a building_admin
//        controls, and lookupStaffCandidate / listStaff / setStaffReadScope /
//        syncMyClaims. All claim writes now funnel through pushClaims() so a claim
//        can never disagree with its staff record. classIds are derived from
//        classes listing the person in teacherUids, so a teacher who creates a
//        class can read it after a token refresh, with no admin step.
//        super_admin is deliberately NOT grantable through the app.
//
// v1.4 — setStaffRole accepts targetEmail as well as targetUid, so onboarding a
//        colleague doesn't require digging their uid out of the Auth console.
//
// v1.3 — Added staff role management: setStaffRole, revokeStaffRole,
//        resyncStaffClaims. These write Auth custom claims, which is what
//        firestore.rules gates on. See firestore.rules for the access model.
//
// v1.2 — Updated model chain for May 2026:
//   - Drops gemini-2.0-* (retires June 1 2026)
//   - Adds gemini-3-flash-preview as primary (3.x quota bucket separate from 2.5)
//   - Adds gemini-3.1-flash-lite-preview (3.1 has its own quota bucket too)
//   - Falls back through aliases (auto-upgrade) and stable 2.5 GA models
//   - Practice mode pings infrequently (5/user/day hard cap) so we lead with
//     stronger preview models — quota burn is minimal even worst-case
//
// v1.1 — Multi-model fallback chain.
const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_FALLBACKS = [
  'gemini-flash-latest',              // alias — auto-upgrades to current best
  'gemini-3.1-flash-lite-preview',    // separate 3.1 quota bucket
  'gemini-2.5-flash',                 // stable GA, capable
  'gemini-flash-lite-latest',         // alias — auto-upgrades to current cheapest
  'gemini-2.5-flash-lite',            // stable GA, cheapest, last resort
];

// ═══════════════════════════════════════════════════════════════════════════
// STAFF ROLES — sync Firestore staff records into Auth custom claims
// ═══════════════════════════════════════════════════════════════════════════
//
// firestore.rules gates everything on request.auth.token.role and .schoolIds.
// Claims can only be set with the Admin SDK, which is why this lives here.
//
// staff/{uid} is the human-editable record. The CLAIM is the enforcement. They
// must not drift, so this function reads the doc and writes the claim from it —
// never the other way round.
//
// classIds deliberately stay OUT of the claim: they change every trimester and
// claims have a ~1000 byte budget. The UI reads them from staff/{uid} to pick a
// default report scope. Rules enforce the building; the UI narrows to classes.

const VALID_ROLES = ['teacher', 'building_admin', 'super_admin'];

// A teacher's read scope is a PER-PERSON setting, not a property of the role.
// A building_admin decides how much of their building each of their teachers can
// see. Default is the tightest option.
const VALID_READ_SCOPES = ['own_classes', 'building'];
const DEFAULT_READ_SCOPE = 'own_classes';

// Claims carry classIds when readScope is 'own_classes', because rules can then
// check membership for free. A classId is ~10 bytes and the claim budget is
// ~1000, so this fits comfortably; we cap it to stay well clear.
const MAX_CLAIM_CLASS_IDS = 60;

// Derive a staff member's classIds from the classes that actually list them as a
// teacher, rather than from a hand-maintained list. This is what lets a teacher
// create a class via CSV import and immediately read it, with no admin step.
async function deriveClassIds(uid, schoolIds) {
  const out = [];
  try {
    const snap = await db.collection('classes')
      .where('teacherUids', 'array-contains', uid).get();
    snap.forEach(d => {
      const c = d.data();
      // Only classes in a building they're actually assigned to. Prevents a
      // stale membership in another school from widening their scope.
      if (!schoolIds.length || schoolIds.includes(c.schoolId || '')) out.push(d.id);
    });
  } catch (e) {
    console.error('deriveClassIds failed', e);
  }
  return out.slice(0, MAX_CLAIM_CLASS_IDS);
}

// Single place that writes claims. Everything else funnels through here so the
// claim can never disagree with the staff record.
async function pushClaims(uid) {
  const snap = await db.collection('staff').doc(uid).get();
  if (!snap.exists || snap.data().active === false) {
    await admin.auth().setCustomUserClaims(uid, null);
    return null;
  }
  const d = snap.data();
  if (!VALID_ROLES.includes(d.role)) {
    await admin.auth().setCustomUserClaims(uid, null);
    return null;
  }
  const schoolIds = Array.isArray(d.schoolIds) ? d.schoolIds : [];
  const readScope = VALID_READ_SCOPES.includes(d.readScope) ? d.readScope : DEFAULT_READ_SCOPE;

  const claims = { role: d.role, schoolIds, readScope };
  // building_admin and super_admin read by building, so they don't need classIds.
  if (d.role === 'teacher' && readScope === 'own_classes') {
    claims.classIds = await deriveClassIds(uid, schoolIds);
  }
  await admin.auth().setCustomUserClaims(uid, claims);
  return claims;
}

// Bootstrap: the very first super_admin can't be created by a super_admin.
// These two addresses can self-promote once, and only to super_admin. Everyone
// else must be granted a role by an existing super_admin.
const BOOTSTRAP_SUPER_ADMINS = [
  "jacob.wilson@sumnerk12.net",
  "jacob.v.wilson@gmail.com",
];

// A building_admin may manage staff only inside their own building(s), and may
// never mint another admin. super_admin is deliberately NOT grantable through
// the UI — the tier that can grant tiers shouldn't be reachable from the thing
// it governs. Use the bootstrap path or the Firebase console.
async function callerStaff(request) {
  const uid = request.auth?.uid;
  if (!uid) return null;
  const snap = await db.collection('staff').doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data();
  if (d.active === false) return null;
  return { uid, role: d.role, schoolIds: Array.isArray(d.schoolIds) ? d.schoolIds : [] };
}

async function callerIsSuperAdmin(request) {
  if (request.auth?.token?.role === 'super_admin') return true;
  // Fall back to the Firestore record in case the caller's token predates their
  // claim being set (claims only refresh on token renewal).
  const uid = request.auth?.uid;
  if (!uid) return false;
  const snap = await db.collection('staff').doc(uid).get();
  return snap.exists && snap.data().role === 'super_admin';
}

// Grant or change a staff member's role.
//
// super_admin: can set any role except super_admin (see callerStaff comment).
// building_admin: can set 'teacher' only, and only within their own building(s).
exports.setStaffRole = onCall({ maxInstances: 3, timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");

  const { targetUid: uidArg, targetEmail, role, schoolIds, readScope,
          displayName, email } = request.data || {};

  // Accept an email instead of a uid. Hunting a uid out of the Auth console is
  // the most annoying step in onboarding a colleague, and the Admin SDK can just
  // look it up. uid still wins if both are supplied.
  let targetUid = uidArg;
  if (!targetUid && targetEmail) {
    try {
      targetUid = (await admin.auth().getUserByEmail(targetEmail)).uid;
    } catch (e) {
      throw new HttpsError("not-found",
        `No account for ${targetEmail}. They need to sign in to TypeThatBook once ` +
        `first — there's no Auth record to attach a role to until they do.`);
    }
  }
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "Provide either targetUid or targetEmail.");
  }
  if (!VALID_ROLES.includes(role)) {
    throw new HttpsError("invalid-argument", `role must be one of: ${VALID_ROLES.join(', ')}`);
  }
  if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
    throw new HttpsError("invalid-argument", "schoolIds must be a non-empty array.");
  }
  if (readScope && !VALID_READ_SCOPES.includes(readScope)) {
    throw new HttpsError("invalid-argument",
      `readScope must be one of: ${VALID_READ_SCOPES.join(', ')}`);
  }

  const callerEmail = request.auth.token.email || '';
  const isSelfBootstrap = targetUid === request.auth.uid
                          && role === 'super_admin'
                          && BOOTSTRAP_SUPER_ADMINS.includes(callerEmail);

  if (!isSelfBootstrap) {
    const isSuper = await callerIsSuperAdmin(request);
    if (!isSuper) {
      const caller = await callerStaff(request);
      if (!caller || caller.role !== 'building_admin') {
        throw new HttpsError("permission-denied",
          "Only a super_admin or building_admin can set staff roles.");
      }
      // A building_admin can create teachers, and only in their own buildings.
      if (role !== 'teacher') {
        throw new HttpsError("permission-denied",
          "A building_admin can only grant the 'teacher' role.");
      }
      const outside = schoolIds.filter(s => !caller.schoolIds.includes(s));
      if (outside.length) {
        throw new HttpsError("permission-denied",
          `Not your building(s): ${outside.join(', ')}`);
      }
    } else if (role === 'super_admin' && targetUid !== request.auth.uid) {
      throw new HttpsError("permission-denied",
        "super_admin is not grantable through the app. Use the bootstrap list " +
        "in functions/index.js, or the Firebase console.");
    }
  }

  let targetUser;
  try {
    targetUser = await admin.auth().getUser(targetUid);
  } catch (e) {
    throw new HttpsError("not-found", "No Auth user with that uid. They must sign in once first.");
  }

  await db.collection('staff').doc(targetUid).set({
    email: email || targetUser.email || '',
    displayName: displayName || targetUser.displayName || '',
    role,
    schoolIds,
    readScope: readScope || DEFAULT_READ_SCOPE,
    active: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: callerEmail,
  }, { merge: true });

  const claims = await pushClaims(targetUid);

  return {
    ok: true, targetUid, role, schoolIds,
    readScope: readScope || DEFAULT_READ_SCOPE,
    classIds: claims?.classIds || [],
    note: "Claims take effect on their next token refresh. They should sign out " +
          "and back in, or the client can call getIdToken(true).",
  };
});

// Change only the read scope. The common day-to-day action for a building_admin.
exports.setStaffReadScope = onCall({ maxInstances: 3, timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const { targetUid, readScope } = request.data || {};
  if (!targetUid) throw new HttpsError("invalid-argument", "targetUid is required.");
  if (!VALID_READ_SCOPES.includes(readScope)) {
    throw new HttpsError("invalid-argument",
      `readScope must be one of: ${VALID_READ_SCOPES.join(', ')}`);
  }

  const targetSnap = await db.collection('staff').doc(targetUid).get();
  if (!targetSnap.exists) throw new HttpsError("not-found", "No staff record for that user.");
  const target = targetSnap.data();

  if (!(await callerIsSuperAdmin(request))) {
    const caller = await callerStaff(request);
    if (!caller || caller.role !== 'building_admin') {
      throw new HttpsError("permission-denied", "Not permitted.");
    }
    const theirSchools = Array.isArray(target.schoolIds) ? target.schoolIds : [];
    if (!theirSchools.some(s => caller.schoolIds.includes(s))) {
      throw new HttpsError("permission-denied", "That person isn't in your building.");
    }
    if (target.role !== 'teacher') {
      throw new HttpsError("permission-denied", "You can only adjust teachers.");
    }
  }

  await db.collection('staff').doc(targetUid).set({
    readScope,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: request.auth.token.email || '',
  }, { merge: true });

  const claims = await pushClaims(targetUid);
  return { ok: true, targetUid, readScope, classIds: claims?.classIds || [] };
});

// Look up one person by email, for the Staff tab's search box.
//
// This exists SPECIFICALLY so the admin UI doesn't need a browsable directory of
// users. Building one would mean writing every student's name and email into a
// queryable collection — a searchable district-wide student directory. This
// returns exactly one person, only to staff, and stores nothing.
exports.lookupStaffCandidate = onCall({ maxInstances: 5, timeoutSeconds: 20 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const caller = (await callerIsSuperAdmin(request)) ? { role: 'super_admin' } : await callerStaff(request);
  if (!caller || !['super_admin', 'building_admin'].includes(caller.role)) {
    throw new HttpsError("permission-denied", "Only admins can look up accounts.");
  }
  const { email } = request.data || {};
  if (!email || typeof email !== 'string') {
    throw new HttpsError("invalid-argument", "email is required.");
  }

  let user;
  try {
    user = await admin.auth().getUserByEmail(email.trim().toLowerCase());
  } catch (e) {
    return { found: false, email };
  }
  const staffSnap = await db.collection('staff').doc(user.uid).get();
  const staff = staffSnap.exists ? staffSnap.data() : null;
  return {
    found: true,
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    lastSignIn: user.metadata?.lastSignInTime || null,
    currentRole: staff && staff.active !== false ? (staff.role || null) : null,
    currentSchoolIds: staff?.schoolIds || [],
    currentReadScope: staff?.readScope || null,
  };
});

// List existing staff, scoped to what the caller administers.
exports.listStaff = onCall({ maxInstances: 5, timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const isSuper = await callerIsSuperAdmin(request);
  const caller = isSuper ? null : await callerStaff(request);
  if (!isSuper && (!caller || caller.role !== 'building_admin')) {
    throw new HttpsError("permission-denied", "Only admins can list staff.");
  }

  const snap = await db.collection('staff').get();
  const rows = [];
  snap.forEach(d => {
    const s = d.data();
    if (!isSuper) {
      const theirs = Array.isArray(s.schoolIds) ? s.schoolIds : [];
      if (!theirs.some(x => caller.schoolIds.includes(x))) return;
    }
    rows.push({
      uid: d.id, email: s.email || '', displayName: s.displayName || '',
      role: s.role || null, schoolIds: s.schoolIds || [],
      readScope: s.readScope || DEFAULT_READ_SCOPE,
      active: s.active !== false,
      classIds: s.classIds || [],
    });
  });
  rows.sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
  return { ok: true, count: rows.length, staff: rows };
});

// Re-derive and re-push the CALLER'S OWN claims.
//
// This is what makes "a teacher creates a class and can immediately read it"
// work. classIds in the claim come from classes that list the person in
// teacherUids, so after creating a class the teacher calls this and refreshes
// their token. It cannot escalate anything: role, schoolIds and readScope all
// come from the staff record, which only an admin can write.
exports.syncMyClaims = onCall({ maxInstances: 10, timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const claims = await pushClaims(request.auth.uid);
  if (!claims) return { ok: true, role: null, note: "No active staff record; claims cleared." };
  return { ok: true, ...claims,
           note: "Call getIdToken(true) on the client to pick these up." };
});

// Strip a staff member's access entirely.
exports.revokeStaffRole = onCall({ maxInstances: 3, timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const { targetUid } = request.data || {};
  if (!targetUid) throw new HttpsError("invalid-argument", "targetUid is required.");
  if (targetUid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Refusing to revoke your own access.");
  }

  const targetSnap = await db.collection('staff').doc(targetUid).get();
  if (!targetSnap.exists) throw new HttpsError("not-found", "No staff record.");
  const target = targetSnap.data();

  if (!(await callerIsSuperAdmin(request))) {
    const caller = await callerStaff(request);
    if (!caller || caller.role !== 'building_admin') {
      throw new HttpsError("permission-denied", "Not permitted.");
    }
    if (target.role !== 'teacher') {
      throw new HttpsError("permission-denied", "You can only revoke teachers.");
    }
    const theirs = Array.isArray(target.schoolIds) ? target.schoolIds : [];
    if (!theirs.some(x => caller.schoolIds.includes(x))) {
      throw new HttpsError("permission-denied", "That person isn't in your building.");
    }
  }

  await db.collection('staff').doc(targetUid).set({
    role: admin.firestore.FieldValue.delete(),
    schoolIds: [], active: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: request.auth.token.email || '',
  }, { merge: true });

  await admin.auth().setCustomUserClaims(targetUid, null);
  await admin.auth().revokeRefreshTokens(targetUid);
  return { ok: true, targetUid };
});

// Re-push claims for everyone. Use after editing staff records in the console.
exports.resyncStaffClaims = onCall({ maxInstances: 3, timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  if (!(await callerIsSuperAdmin(request))) {
    throw new HttpsError("permission-denied", "Only a super_admin can resync claims.");
  }
  const snap = await db.collection('staff').where('active', '==', true).get();
  const synced = [];
  for (const d of snap.docs) {
    const claims = await pushClaims(d.id);
    if (claims) synced.push({ uid: d.id, email: d.data().email, role: claims.role });
  }
  return { ok: true, count: synced.length, synced };
});

exports.generatePractice = onCall(
  {
    secrets: [geminiApiKey],
    maxInstances: 5,       // prevent runaway scaling
    timeoutSeconds: 30,
  },
  async (request) => {
    // 1. Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = request.auth.uid;

    // 2. Rate limit: 5 per user per day
    const today = new Date().toISOString().split("T")[0];
    const limitRef = db.collection("practice_limits").doc(uid);
    const limitSnap = await limitRef.get();
    let count = 0;
    if (limitSnap.exists) {
      const data = limitSnap.data();
      if (data.date === today) count = data.count || 0;
    }
    if (count >= DAILY_LIMIT) {
      throw new HttpsError(
        "resource-exhausted",
        `You've used all ${DAILY_LIMIT} practice sessions for today. Try again tomorrow!`
      );
    }

    // 3. Validate input
    const { problemChars, bookTitle, chapterTitle, textSnippet } = request.data;
    if (!problemChars || !Array.isArray(problemChars) || problemChars.length === 0) {
      throw new HttpsError("invalid-argument", "No problem characters provided.");
    }

    // Sanitize inputs (prevent prompt injection)
    const safeChars = problemChars.slice(0, 8).map(c => String(c).substring(0, 10));
    const safeTitle = String(bookTitle || "a book").substring(0, 200);
    const safeChapter = String(chapterTitle || "").substring(0, 200);
    const safeSnippet = String(textSnippet || "").substring(0, 500);

    // 4. Build prompt
    const charList = safeChars.map(c => {
      if (c === " " || c === "Space") return "the space bar";
      if (c === "\n" || c === "Enter") return "line breaks / the Enter key";
      return `the "${c}" character`;
    }).join(", ");

    const prompt = `Write a single paragraph of 100-150 words for a typing practice exercise for middle school students. Requirements:
- Write in a style and tone similar to "${safeTitle}"${safeChapter ? ` (currently in a chapter called "${safeChapter}")` : ""}
- The paragraph should naturally and frequently use ${charList}
- Make it engaging, fun, and age-appropriate for 11-14 year olds
- Use only standard English letters, numbers, and punctuation (periods, commas, semicolons, apostrophes, quotes, question marks, exclamation points)
- Do NOT use special characters, emojis, or unusual formatting
- Write ONLY the paragraph text with no introduction, title, or explanation

${safeSnippet ? `Here is a brief excerpt from the book for style reference:\n"${safeSnippet}"` : ""}

Remember: write ONLY the practice paragraph, nothing else.`;

    // 5. Call Gemini API with fallback chain
    const apiKey = geminiApiKey.value();
    let generatedText;
    const models = [GEMINI_MODEL, ...GEMINI_FALLBACKS];
    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    });

    let lastError = null;
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: requestBody,
          }
        );

        if (!response.ok) {
          const errBody = await response.text();
          const status = response.status;
          console.warn(`Gemini model ${model} failed (${status}):`, errBody.substring(0, 200));
          // Retry on rate limit, server error, or model not found
          if (status === 429 || status >= 500 || status === 404) {
            lastError = `${model}: HTTP ${status}`;
            continue;
          }
          // Other errors (400 bad request, 403 forbidden) won't be fixed by switching models
          throw new HttpsError("internal", "Practice text generation failed. Try again.");
        }

        const result = await response.json();
        generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
          console.warn(`Gemini model ${model} returned empty text, trying next...`);
          lastError = `${model}: empty response`;
          continue;
        }

        // Success — clean up and break
        console.log(`Practice generated with model: ${model}`);
        generatedText = generatedText
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/\u2014/g, "--")
          .replace(/\u2013/g, "-")
          .trim();
        break;

      } catch (e) {
        if (e instanceof HttpsError) throw e;
        console.warn(`Gemini model ${model} exception:`, e.message);
        lastError = `${model}: ${e.message}`;
        continue;
      }
    }

    if (!generatedText) {
      console.error("All Gemini models failed. Last error:", lastError);
      throw new HttpsError("internal", "Could not generate practice text. Try again.");
    }

    // 6. Increment rate limit
    await limitRef.set({ date: today, count: count + 1 }, { merge: true });

    // 7. Return
    return {
      text: generatedText,
      prompt: prompt,
      remaining: DAILY_LIMIT - count - 1,
    };
  }
);
