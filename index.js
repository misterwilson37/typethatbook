const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const DAILY_LIMIT = 5;

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
