// score-save.js v1.0.0 — THE ONE PLACE A SPOTON SCORE IS WRITTEN.
//
// Written by Figgins, Sept 2026 (privacy round). Every game imports saveScore() from
// here instead of building its own addDoc() — so what SpotOn stores about a student
// is decided in exactly one file (Rule 9), and a test can check that one file.
//
// ⚠️⚠️ WHAT GOES WHERE, AND WHY IT IS SPLIT IN TWO:
//   scores/{autoId}   PUBLIC. Anyone on the internet can read it (the leaderboard
//                     page has no sign-in). So it holds ONLY: game, initials, score,
//                     the account ID, the time, and a few game-stat numbers.
//                     Never an email, never a name, never a photo.
//   players/{uid}     PRIVATE. Only the site admin can read it (firestore.rules).
//                     Holds the student's school email and when they last saved a
//                     score — the one link from initials back to a real student.
//
// Firestore security rules protect whole documents, never single fields, so an email
// sitting on a public score document is public no matter what the page displays.
// That is the whole reason for the split.
//
// ⚠️ SCORE_FIELDS MUST MATCH the hasOnly() list in firestore.rules. The rules reject
// any other field, so a game adding one here without adding it there fails to save.
// tests/privacy-promises-test.mjs checks the two lists match.

import { collection, addDoc, doc, setDoc, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const SCORE_SAVE_VERSION = '1.0.0';

// Every field a score document may carry. uid and timestamp are added here, not by games.
export const SCORE_FIELDS = [
    'gameId', 'initials', 'score', 'uid', 'timestamp', 'flagged',
    'roundCount', 'averageScore', 'roundsCompleted', 'bestStreak',
    'categoryScores', 'levelCount'
];

/**
 * Save one score for the signed-in student.
 * @param db      Firestore instance
 * @param user    the Firebase Auth user (must be signed in)
 * @param fields  { gameId, initials, score, ...optional game stats } — no uid/timestamp
 * @returns the new score's document id
 * Throws if a field isn't allowed, or if the score write fails.
 */
export async function saveScore(db, user, fields) {
    if (!db || !user) throw new Error('saveScore: not signed in');
    const record = { ...fields, uid: user.uid, timestamp: serverTimestamp() };
    for (const key of Object.keys(record)) {
        if (!SCORE_FIELDS.includes(key)) {
            throw new Error(`saveScore: "${key}" is not an allowed score field`);
        }
    }
    const ref = await addDoc(collection(db, 'scores'), record);

    // The private email link. Written AFTER the score, and a failure here never costs
    // the student their score — the next score they save writes it again.
    try {
        await setDoc(doc(db, 'players', user.uid), {
            email: user.email,
            lastPlayed: serverTimestamp()
        });
    } catch (err) {
        console.warn('Player record not saved (score was):', err && err.code);
    }
    return ref.id;
}
