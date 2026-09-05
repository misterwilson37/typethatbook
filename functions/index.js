// index.js v1.7.1 — Cloud Functions source. generatePractice() is the ONLY
// export, and now that is enforced by the file rather than asserted by a comment.
// NOT deployable from this repo: it needs `firebase deploy`, and Jake has no CLI.
// Treat this file as the record of what is running, and bump this line whenever
// the deployed function changes.
//
// v1.7.1 — ⚠️⚠️ THE DAILY LIMIT WAS KEYED ON A UTC DAY, THE SAME BUG CLASS
//          §3.1 AND THE MIDNIGHT-STRADDLE WORK FOUGHT ELSEWHERE IN THIS
//          PROJECT — nobody had checked this file against it because it
//          cannot run in `npm test`. `new Date().toISOString().split("T")[0]`
//          is always the UTC calendar date. daylog.js's `ymd()` avoids this by
//          reading a Date object's LOCAL getFullYear()/getMonth()/getDate() —
//          but that trick only works in the browser, where "local" IS the
//          student's own clock. A Cloud Functions container's local timezone
//          is UTC; porting daylog.js's approach here verbatim would have
//          looked like a fix and changed nothing.
//          ⚠️ EFFECT: in September (CDT, UTC-5) the 5-per-day cap reset at
//          7pm Central instead of midnight; in winter (CST, UTC-6) at 6pm.
//          A student practising after school and again after that rollover
//          got a second set of 5 before their actual day was over.
//          ⚠️ THE FIX: `todayInSchoolTZ()` reads the date in a FIXED,
//          explicitly-named timezone (`America/Chicago`) via
//          `Intl.DateTimeFormat`, which carries its own DST table — no
//          separate winter/summer offset to keep in sync by hand. Every
//          school this app has ever run in is in that timezone; if that ever
//          stops being true, this is the one line that needs to know.
//          ⚠️ NOT COVERED BY npm test, same reason the bug survived: this
//          file has no harness. Verified by hand against the two DST cases
//          (a January date and a July date) before shipping — see the round's
//          own notes for the exact check.
//
// v1.7.0 — THE VARIETY FLOOR. A session needs at least 3 DIFFERENT missed
//          characters (each missed enough times to count, deduped exactly) before
//          generatePractice() will run at all — previously any single missed
//          character, even once, could produce a paragraph "focused on" one
//          letter once the time gate passed. Also moved input validation ahead
//          of the daily-limit reservation, so a rejected request no longer costs
//          the student one of their 5 slots. Client-side half of the fix is in
//          game.js's getMissedCharsHTML()/startPracticeMode() — this is the
//          server-side floor under it, since this function is a direct callable
//          reachable from devtools regardless of what the button does.
//
// v1.6.0 — Deleted ~360 lines: the seven abandoned custom-claims functions that
//          no client called and no security rule consulted. See the block below
//          for why leaving them was a hazard rather than mere clutter. Also made
//          the daily rate limit atomic, and stopped a 429 from fanning out
//          across six models.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const DAILY_LIMIT = 5;

// ⚠️ v1.7.1 — see the header note. This project's students are in one
// district, one timezone, always — so a fixed IANA zone is correct here in a
// way it would not be for a service with users anywhere. Intl.DateTimeFormat
// handles the CDT/CST transition itself; 'en-CA' is just the locale whose
// short date format happens to be YYYY-MM-DD.
function todayInSchoolTZ() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

// v1.3–v1.5 — the custom-claims staff system. Removed in v1.6.0.
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
// WHAT USED TO BE HERE, AND WHY IT IS GONE  (v1.6.0)
// ═══════════════════════════════════════════════════════════════════════════
//
// Roughly 360 lines implementing staff roles as Auth CUSTOM CLAIMS:
// setStaffRole, setStaffReadScope, lookupStaffCandidate, listStaff,
// syncMyClaims, revokeStaffRole, resyncStaffClaims, plus pushClaims() and
// deriveClassIds() behind them.
//
// The whole approach was abandoned. Custom claims need the Admin SDK, the Admin
// SDK needs a Cloud Functions deploy, and a deploy needs a command line Jake
// does not have. admin.js v3.0.0 moved the role model to a Firestore DOCUMENT
// READ (staff/{uid}), which needs none of that — and has the better property
// that a role change takes effect immediately rather than on the person's next
// sign-in. firestore.rules v2.x gates on the document, not on any claim.
//
// So those seven functions had no caller in the entire codebase (verified by
// grep across every .js and .html file) and nothing read the claims they wrote.
//
// ⚠️ REMOVED RATHER THAN LEFT IN PLACE FOR A SPECIFIC REASON. Dead code in a
// file nobody can deploy looks harmless. It was not: `exports.syncMyClaims` was
// callable by any signed-in user, and the header comment claiming "only
// generatePractice() is deployed" was true only for as long as nobody ran
// `firebase deploy`. The first time anyone got CLI access, that command would
// have silently deployed seven functions implementing an access-control system
// the security rules no longer consult. That is a live footgun, not clutter.
//
// If claims are ever wanted again, they are in git history — but read
// HANDOFF.md §4 first, because the document model replaced them on purpose.

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

    // 2. Validate input. ⚠️ MOVED AHEAD OF THE RATE-LIMIT RESERVATION (v1.7.0)
    // — it used to run after step 2 reserved a daily slot, which meant a
    // malformed or under-qualified request burned one of the student's 5 for
    // nothing before ever reaching Gemini. Step 2's own comment explains why a
    // GENERATION failure should still cost a slot (it's the only way to stop
    // "trigger failures to dodge the cap" as an exploit against real spend);
    // that reasoning doesn't apply here — this is free, synchronous, and
    // happens before any Firestore write, so rejecting bad input costs the
    // student nothing.
    const { problemChars, bookTitle, chapterTitle, textSnippet } = request.data;
    if (!problemChars || !Array.isArray(problemChars) || problemChars.length === 0) {
      throw new HttpsError("invalid-argument", "No problem characters provided.");
    }

    // Sanitize inputs (prevent prompt injection)
    const safeChars = problemChars.slice(0, 8).map(c => String(c).substring(0, 10));
    const safeTitle = String(bookTitle || "a book").substring(0, 200);
    const safeChapter = String(chapterTitle || "").substring(0, 200);
    const safeSnippet = String(textSnippet || "").substring(0, 500);

    // ⚠️ THE VARIETY FLOOR (v1.7.0). game.js's getMissedCharsHTML() and
    // startPracticeMode() already hold the client to this — a session must
    // have missed at least MIN_PROBLEM_CHARS DIFFERENT characters (each one
    // deduped exactly, not case-folded — "F" and "f" are different keys to
    // hit) before the button even offers to call this. But that check runs in
    // a browser a student can open devtools on, and this function is exposed
    // as a direct callable — nothing stops a request built by hand with
    // `problemChars: ["f","f","f"]`, which is 3 elements and 1 real letter.
    // Enforced here too, on the deduplicated set actually going into the
    // prompt, so a single dominant letter can never again be the entire
    // "focus" of a generated paragraph. Reported by Jake: a student who'd
    // missed "F" and "J" got a paragraph so F-heavy it was free banked time
    // for one letter, not remediation.
    const MIN_PROBLEM_CHARS = 3;
    const uniqueChars = new Set(safeChars);
    if (uniqueChars.size < MIN_PROBLEM_CHARS) {
      throw new HttpsError(
        "invalid-argument",
        `Practice needs at least ${MIN_PROBLEM_CHARS} different tricky letters — keep typing and it'll unlock.`
      );
    }

    // 3. Rate limit: 5 per user per day.
    //
    // ⚠️ READ AND WRITE IN ONE TRANSACTION. This used to read the count, generate
    // the paragraph, then write count + 1 — a read-modify-write with a multi-second
    // gap in the middle. Two overlapping calls both read 2, both wrote 3, and the
    // student got extra turns. maxInstances: 5 narrowed the window but did not
    // close it.
    //
    // The slot is RESERVED BEFORE generation, which means a failed generation
    // costs the student one of their five. That is the deliberate direction to err:
    // the limit exists to cap Gemini spend, and a limit that can be bypassed by
    // triggering failures is not a limit. Five is generous for a feature nobody
    // has asked for yet.
    const today = todayInSchoolTZ();
    const limitRef = db.collection("practice_limits").doc(uid);
    let count;
    try {
      count = await db.runTransaction(async (tx) => {
        const snap = await tx.get(limitRef);
        const data = snap.exists ? snap.data() : null;
        const used = (data && data.date === today) ? (data.count || 0) : 0;
        if (used >= DAILY_LIMIT) return -1;              // signal, don't throw in a tx
        tx.set(limitRef, { date: today, count: used + 1 }, { merge: true });
        return used;
      });
    } catch (e) {
      console.error("practice_limits transaction failed:", e);
      throw new HttpsError("internal", "Could not start a practice session. Try again.");
    }
    if (count === -1) {
      throw new HttpsError(
        "resource-exhausted",
        `You've used all ${DAILY_LIMIT} practice sessions for today. Try again tomorrow!`
      );
    }

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
          // ⚠️ 429 STOPS THE CHAIN. It used to fall through, which turned one
          // rate-limited request into six. Thirty students hitting the practice
          // unlock at the same moment — they all started class together — became
          // up to 180 API calls in a burst, making the quota problem worse the
          // harder it was hit. A 429 means "come back later", so we say that.
          if (status === 429) {
            throw new HttpsError(
              "resource-exhausted",
              "The practice-text robot is taking a nap \u2014 too many people asked at " +
              "once. Give it a minute and try again."
            );
          }
          // 5xx and 404 are per-model problems, so a different model may well
          // work. Those still fall through.
          if (status >= 500 || status === 404) {
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

    // 6. The slot was already reserved in step 2's transaction. Incrementing
    //    again here (as v1.5 did) would double-count every session.

    // 7. Return
    return {
      text: generatedText,
      prompt: prompt,
      remaining: DAILY_LIMIT - count - 1,
    };
  }
);
