# APPROVED (shape) — `game_scores` rules + index

✅ **JAKE APPROVED THE SHAPE, 2026-09-07:** *"I like your plan, from what I can
understand of it. Kids compete against themselves and then against everyone else,
reducing the number of writes."* — which is exactly the personal-best mechanic
below, and his summary of it is better than mine.

⚠️⚠️ **APPROVED IS NOT DEPLOYED. THIS HAS STILL NEVER BEEN EXECUTED.** The shape
is settled; the rules text is not verified. It must pass `npm run test:rules`
against the emulator before it goes near the console, and a Claude instance has to
run that — Jake has no CLI. ⚠️ `firestore.rules` is the one file he cannot test
from a browser, which makes it the file that most needs executing, and Round 20
shipped a designed fix the deployed rules rejected because nobody spent the nine
seconds.

⚠️ **DO NOT PASTE THESE INTO THE CONSOLE UNTIL THE LEADERBOARD IS ACTUALLY BEING
WRITTEN.** A rule for a collection nothing writes is dead surface area, and an
index costs storage for nothing. `tests/game-assumptions-test.mjs` Part F asserts
`game_scores` is **absent** from `firestore.rules`; when the write path lands,
that is another assertion to invert deliberately rather than delete.

## Why not the existing `leaderboard` collection

`leaderboard` is one document per uid with four scalar category fields and a
top-10 `orderBy`. A game board is keyed by `(game, lessonId)`, which cannot be an
`orderBy` on a map field — so it needs its own collection, or the existing document
has to grow one field per game per lesson, which is unbounded.

## Shape

Collection `game_scores`, document id `{uid}_{game}_{lessonId}`.

| field | type | note |
|---|---|---|
| `uid` | string | owner |
| `game` | string | `'escape'` \| `'deadline'` \| `'shatter'` — frozen ids from `game-names.js` |
| `lessonId` | string | or `'arcade'` for endless runs. ⚠️ `'arcade'` is a reserved lesson id — a real lesson must never be called that |
| `score` | number | from the shell's `report().score` |
| `initials` | string | ⚠️ **initials only**, same discipline as `leaderboard`, which every student can read |
| `classId` | string | for class-scoped boards |
| `wpm`, `acc` | number | for display beside the score, **NOT** for grading |
| `updatedAt` | timestamp | |

⚠️ **WRITTEN ONLY ON A PERSONAL BEST** for that `(game, lessonId)` — roughly one
write per student per lesson per game, which keeps the WAL-era near-zero cost
profile intact. A write on every game-over would be a firehose on a Friday.

⚠️ **TWO BOARDS, NOT ONE.** Assessed runs (`lessonId` = a real lesson) and arcade
runs (`lessonId` = `'arcade'`) rank separately. Mixing them puts forty minutes of
Friday above a passed graded run. Jake's framing: a different board because it is
a different game.

⚠️ **AS OF JAKE'S 4e RULING, ESCAPE KEY WRITES ONLY ARCADE ROWS** — it is
arcade-only for now, so it never produces a `lessonId` that is a real lesson.
Deadline is the only game writing assessed rows today. ⚠️ Do not build the query
layer on the assumption that every game appears on both boards; read
`game-names.js`'s `assessed` flag.

## Rule (append to `firebase/firestore.rules`)

```
match /game_scores/{docId} {
  // Every student may read the boards.
  allow read: if request.auth != null;

  // A student may only write their OWN score doc, may only ever raise it, and
  // may not author anything the client should not be authoring.
  allow create: if request.auth != null
    && docId == request.auth.uid + '_' + request.resource.data.game
                + '_' + request.resource.data.lessonId
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.score is int
    && request.resource.data.score >= 0
    && request.resource.data.initials.size() <= 3;

  allow update: if request.auth != null
    && resource.data.uid == request.auth.uid
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.score is int
    // ⚠️ MONOTONIC. Without this a client can lower its own score, which sounds
    // harmless until a student "resets" a board they are embarrassed by and the
    // teacher's view of the class disagrees with what the student remembers.
    && request.resource.data.score > resource.data.score;

  allow delete: if false;
}
```

⚠️ **`allow delete: if false`** — a student deleting their own score is the same
divergence as lowering it. A teacher who needs one gone has the console.

⚠️ **THE `docId` CHECK IS LOAD-BEARING.** Without it a student can write a document
under someone else's composite key while still passing the `uid` field check,
because the id and the field would be unrelated.

⚠️ **THIS RULE HAS NOT BEEN RUN AGAINST THE EMULATOR.** `firebase.json` exists for
`npm run test:rules`, and `firestore.rules` is the one file Jake cannot test from a
browser — which makes it the file that most needs executing. A session should run
these before they go near the console. Reasoned-about rules are how four earlier
rounds went wrong.

## Index (append to `firebase/firestore.indexes.json`)

```json
{
  "collectionGroup": "game_scores",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "game",     "order": "ASCENDING" },
    { "fieldPath": "lessonId", "order": "ASCENDING" },
    { "fieldPath": "score",    "order": "DESCENDING" }
  ]
}
```

Add a second index with `classId` ahead of `game` only if class-scoped boards are
wanted. ⚠️ Do not add it speculatively.
