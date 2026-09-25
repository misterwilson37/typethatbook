# Changelog — SpotOn

## Sept 2026 — Picture Perfect tuning (Figgins)

- pictureperfect.html 2.4.2 — pixelated blocks 6 → 5 px, so the effect is a little
  subtler (`PIXEL_SIZE`).

## Sept 2026 — Picture Perfect outage fix (Figgins)

- pictureperfect.html 2.4.1 — every picture failed to load after they moved to Firebase
  Storage: the game asked for cross-origin (CORS) access it never uses, and the bucket
  doesn't grant it. Removed the request; the game only draws pictures.
- admin.html 2.11.0 — How-to gains the one-time Cloud Shell step that gives the storage
  bucket a CORS setting (needed by Sweet Spot's cropped pictures and the admin level
  editor, which DO read pixels).
- tests/browser-smoke-test.py — pictures now come from a second local server that sends
  no CORS header, reproducing the outage (red with the old line, green with the fix).

## Sept 2026 — Format Trainer boards and Picture Perfect speed (Figgins)

- leaderboard.html 1.5.0 — Format Trainer button with a Mode row (Basic / MLA /
  Random Speed, Streak). Speed boards rank fastest-first and show m:ss under a "Time"
  column. Format Trainer stays out of "All Games" (seconds can't rank against points).
  Quick clicks between boards can't draw a stale one.
- pictureperfect.html 2.4.0 — stopwatch on the picture, running only while a picture
  is up and unanswered. Each correct answer earns 100 plus up to 50 speed bonus (full
  within 2 s, none at 10 s), so a perfect fast run scores up to 1500. Game-over shows
  accuracy + bonus + total time.
- tests/browser-smoke-test.py — Format Trainer boards and a full 10-round Picture
  Perfect game.

## Sept 2026 — Cleanup round (Figgins)

- admin.html 2.10.0 — Leaderboards tab rebuilt on one loader for the table and CSV:
  search and the flagged filter now look at the whole game, not just the top N (a
  low-ranked student used to come back "No matching scores"); fast typing can't draw
  a stale result; real error messages (missing index / permission) instead of
  "Error loading scores"; flag and delete buttons report failures; Format Trainer's
  four scoring modes added to the filter with readable names, fastest-first order and
  m:ss times; CSV neutralises formula-like initials and no longer risks a cancelled
  download in Safari; "1 score", not "1 scores". How-to Copy buttons are one fixed
  width (a longer "Copied" label used to squeeze the command box).
- formattrainer.html 0.11.1 — loads the self-hosted fonts (now Inter like every game).
- sweetspot.html 2.4.1 — "No levels found" stops the loading spinner and points to
  the admin's Sweet Spot tab.
- tests/browser-smoke-test.py — new: every page in a real headless browser.

## Sept 2026 — Privacy round, part 5 (Figgins)

- privacy.html 1.1.0 and SECURITY.md — mailing address added (COPPA 312.4(d)(1)).

## Sept 2026 — Privacy round, part 4 (Figgins)

- admin.html 2.9.0 — "📋 How-to" reference sheet at the top of the Privacy tab: the
  quarterly routine, opening Cloud Shell, every command with a Copy button, deletion and
  stop-collection requests, troubleshooting. Retention and delete results point to it.
- scripts/auth-cleanup.py 1.0.1 — instructions use STUDENT_EMAIL, matching the How-to;
  a test checks every How-to command appears in the script's own instructions.

## Sept 2026 — Privacy round, part 3 (Figgins)

- admin.html 2.8.0 / privacy-tools.js 1.2.0 — retention check names the next student
  due and the date; delete-a-student points at the new script.
- scripts/auth-cleanup.py 1.0.0 — deletes sign-in accounts unused 24 months (counts
  silent sign-in renewals), or one account on request; `--disable` to stop collection.
  Runs in Google Cloud Shell, no key file.
- privacy.html 1.0.1 — sign-in accounts expire on their own 24 months of disuse
  (was: "at the same time" as the scores, which the script doesn't do).
- tests: auth-cleanup-test.py (Auth emulator) added to `npm run test:emulator`.

## Sept 2026 — Privacy round, part 2 (Figgins)

- admin.html 2.7.0 — "Move outside pictures into SpotOn" (Privacy tab), with a
  manual-upload fallback for any website that blocks the download; pictures added or
  edited by URL are copied into Firebase Storage right after saving.
- privacy-tools.js 1.1.0 — picture-source list now counts only the address each game
  actually loads (not credit links); planImageMoves / moveImage / hostPictureInSpotOn.

## Sept 2026 — Privacy round (Figgins)

- Scores no longer store email, name or photo; one shared writer (`score-save.js` 1.0.0)
  saves a public score and a private `players/{uid}` email record.
- Games: Balanced Placement, Balanced Placement II, Find the Center, Format Frenzy,
  Perfect Alignment, Spot the Format 2.2.0; Picture Perfect 2.3.0; Sweet Spot 2.4.0;
  Format Trainer 0.11.0.
- firestore.rules / storage.rules 2.0.0 (now kept in the repo).
- admin.html 2.6.0 — database-checked admin gate, Privacy tab, emails from `players`.
- privacy.html 1.0.0 and SECURITY.md — new. Privacy link on every page.
- index.html 2.3.0, leaderboard.html 1.4.0, games.css 2.1.0, firebase-config.js 1.1.0.
- Self-hosted fonts (`fonts/`) and built `tailwind.css`, replacing Google Fonts and the
  Tailwind CDN.
- privacy-tools.js 1.0.0 and `tests/` — new.
- migration.html removed.

## Aug 2026 — Leaderboard indexes (Binny)

See `HANDOFF-leaderboard-indexes.md` and README "Version History".
