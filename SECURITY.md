# Spot On! — Information Security Program

**Operator:** Jake Wilson, Computer Science, Sumner County Schools
**Site:** https://spoton.misterwilson.org
**Last reviewed:** September 2026
**Contact for security or privacy concerns:** privacy@misterwilson.org · (615) 379-7226
**Mailing address:** Jake Wilson, 4501 Charlotte Ave, PO Box 90096, Nashville, TN 37209

This document describes how Spot On! protects the information it keeps about
students. It is written to meet the written information-security program requirement
in the amended COPPA Rule (16 CFR 312.8) and the "reasonable security procedures and
practices" requirement of Tennessee's Student Online Personal Protection Act (Tenn.
Code § 49-1-708). It describes what the site actually does today.

---

## 1. What Spot On! is for

Spot On! is a set of visual-perception games — alignment, spacing, balance and
formatting recognition — used in Sumner County Schools Computer Science classes.
Students play the games and can save their scores to class leaderboards.

**Spot On! does not show advertising, does not sell or rent student information, does
not build profiles for any purpose other than the class, and does not share student
information with anyone for marketing.**

## 2. What information is kept, and why

| Information | Where it is kept | Who can read it | Why |
|---|---|---|---|
| Initials the student chooses (1–3 characters) | Score records | Anyone | Leaderboards |
| Score, game, time saved, simple game statistics | Score records | Anyone | Leaderboards |
| Account ID (random identifier) | Score records and the student's player record | Anyone (score records) | Connecting scores to an account |
| School email address, and date of last saved score | The student's private player record | Site administrator only | Knowing whose scores are whose; retention |

Spot On! does **not** store students' names or photos in its database, and does not
collect addresses, phone numbers, birthdates, audio or video, location, student ID
numbers, or any health, disability or demographic information.

Google's sign-in service (Firebase Authentication) keeps its own sign-in record for
each account, which includes the name, email and profile photo from the student's
Google account. Spot On! does not copy the name or photo into its own records.

Players who do not sign in can still play; nothing about them is saved.

**How the public/private split is enforced.** Security rules protect whole records,
not individual fields, so a field on a publicly readable record is public. That is why
the email is kept on a separate record (`players/{uid}`) that only the site
administrator can read, and why the rules refuse any score record carrying a field
other than the fixed list above. Every game saves scores through one shared file,
`score-save.js`, so what is stored is decided in one place.

## 3. Where the information is stored

All student information is stored in **Google Firebase** (Firestore database and
Firebase Authentication), a service of Google LLC. The database is located in the
**United States** (Firestore location `us-east1`, South Carolina, verified in the
Google Cloud console in September 2026). Game pictures are stored in Firebase. The
site's pages are hosted on **GitHub Pages** and contain no student information.

## 4. Who can see it

Access is enforced by **Firestore Security Rules** — code that runs on Google's
servers and checks every read and write. It cannot be bypassed from a browser. The
rules are kept in this repository as `firestore.rules` and `storage.rules`.

| Who | What they can see or do |
|---|---|
| **Anyone, signed in or not** | Leaderboards: initials, game, score, account ID |
| **A signed-in student** | The above, plus save their own scores and their own player record — only under their own account, only their own sign-in email, only the permitted fields |
| **The site administrator** (two named accounts) | Everything, including email addresses; change game content; delete records |

Administrator access is granted only to two named, verified email addresses listed in
the security rules. The administration page checks with the database before showing
anything, and signs out any other account.

## 5. Other services involved

| Service | What it receives | Why |
|---|---|---|
| **Google Firebase** (Google LLC) | The information in section 2, and the game pictures | Storing it, and signing students in with their school accounts |
| **GitHub Pages** (GitHub, Inc.) | The standard information any web server receives when a page loads | Serving the site's pages |

Fonts and page styles are served from Spot On! itself rather than from an outside
service, so no other company is contacted when a page loads. Spot On! uses no
analytics or tracking services.

## 6. How long information is kept

**A student's email record is deleted, and their scores made anonymous, after 24
months without a saved score.** Anonymous scores keep their initials and score on the
leaderboards but are connected to no account.

Computer Science is taught in nine-week rotations, so a student may go more than a
year between one grade's rotation and the next. Twenty-four months keeps a returning
student's scores connected to them, while clearing the records of students who have
left.

The site administrator runs a retention check every quarter from the administration
page. It reads every score and player record, finds students whose most recent saved
score is more than 24 months old, and lists them; nothing changes until the
administrator types a confirmation. It then removes the account ID from those
students' scores first and deletes their email record last. In the same quarterly
check, the administrator deletes sign-in accounts unused for 24 months with
`scripts/auth-cleanup.py`, run in Google Cloud Shell under the administrator's own
Google account (no key file is stored anywhere), since web pages are not permitted to
delete another person's sign-in account. The script lists first and deletes only after
a typed confirmation, and never deletes the administrator accounts. "Unused" counts
both signing in and a browser silently renewing a sign-in.

## 7. Deleting a student's information

When the school, or a parent or guardian through the school, asks for a student's
information to be deleted, the site administrator removes it within 30 days: every
score, the email record and the sign-in account.

The administration page's delete tool first lists how many records it will remove,
then requires the student's email address to be typed again before anything is
deleted. It deletes the scores first and the email record last, so an interrupted run
leaves the student findable and can simply be repeated. The sign-in account is then
deleted with `scripts/auth-cleanup.py --email … --delete` (or in the Firebase console). If a family asks that no further information be
collected, the sign-in account is disabled instead, so the student can still play but
nothing is saved.

## 8. How the information is protected

- **Every read and write is checked** by Firestore and Storage Security Rules
  (section 4).
- **Scores cannot carry personal information.** The rules reject any score record
  with a field outside the fixed list, and any record saved under someone else's
  account.
- **All traffic is encrypted** in transit (HTTPS), and Google encrypts stored data.
- **Sign-in is through Google accounts.** Spot On! never sees or stores a password.
- **Only two named administrator accounts** can change game content, upload
  pictures, or see email addresses.
- **The rules and privacy tools are tested.** The repository's `tests/` folder runs
  the real security rules and the real delete and retention code against a Firebase
  emulator, and checks every promise in the privacy policy against the code.
- **Changes are recorded** in this repository's history.

## 9. If something goes wrong

If the site administrator learns that student information may have been accessed by
someone who should not have it, he will:

1. Stop the problem as quickly as possible — for example by locking down the security
   rules or disabling affected accounts.
2. Notify the district's technology department promptly, so the district can meet its
   own obligations to families.
3. Work out what information was involved and which students were affected.
4. Fix the cause, and record what happened and what was changed.

## 10. Review

This program is reviewed at least once a year, and whenever Spot On! starts collecting
a new kind of information or starts using a new outside service.

---

*Questions about this document, or requests to see or delete a student's information,
should go to privacy@misterwilson.org, (615) 379-7226, or Jake Wilson, 4501 Charlotte
Ave, PO Box 90096, Nashville, TN 37209.*
