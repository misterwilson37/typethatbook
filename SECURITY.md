# TypeThatBook — Information Security Program

**Operator:** Jake Wilson, Computer Science, Sumner County Schools
**Site:** https://typethatbook.misterwilson.org
**Last reviewed:** September 2026
**Contact for security or privacy concerns:** through the student's school

This document describes how TypeThatBook protects the information it collects
from students. It is written to meet the written information-security program
requirement in the amended COPPA Rule (16 CFR 312.8) and the "reasonable security
procedures and practices" requirement of Tennessee's Student Online Personal
Protection Act (Tenn. Code § 49-1-708). It describes what the site actually does
today; anything not yet in place is marked **Planned**.

---

## 1. What TypeThatBook is for

TypeThatBook is a typing-practice site used in Sumner County Schools computer
science classes. Students type passages from public-domain books, work through
typing lessons, and play typing games. Teachers use it to see how much each
student has practised and how their speed and accuracy are developing.

**TypeThatBook does not show advertising, does not sell or rent student
information, does not build profiles for any purpose other than the class, and
does not share student information with anyone for marketing.**

## 2. What information is collected, and why

| Information | Where it comes from | Why it is needed |
|---|---|---|
| Name and school email address | The student's school Google account, at sign-in | So the teacher can tell which student's work is which |
| An account ID (a random identifier) | Created by Google's sign-in service | To connect a student's work to their account |
| Class and school | Assigned by the teacher | So teachers see only their own students |
| Typing practice records: time spent, characters typed, speed, accuracy, and which book or lesson | Recorded while the student types | This is the practice the class grades |
| Lesson progress and reading position in each book | Recorded while the student types | So a student can pick up where they left off |
| Game scores | Recorded when a student plays | For the in-class leaderboard |

TypeThatBook does **not** collect: home addresses, phone numbers, dates of birth,
photos, audio or video, location, student ID numbers, grades from other classes,
or any disability, health or demographic information.

Students who use the site without signing in (guest mode) have their progress
kept only in their own browser; nothing about a guest is stored on the server. If
that student later signs in on the same browser, their guest practice is added to
their account.

## 3. Where the information is stored

All student information is stored in **Google Firebase** (Firestore database and
Firebase Authentication), a service of Google LLC. The database is located in the
**United States** (Firestore location `nam5`, Google's United States multi-region,
verified in the Google Cloud console in September 2026). The site's pages themselves are hosted on **GitHub Pages** and contain
no student information.

## 4. Who can see it

Access is enforced by **Firestore Security Rules** — code that runs on Google's
servers and checks every single read and write. It cannot be bypassed from a
browser. The rules are kept in this repository at `firebase/firestore.rules`.

| Who | What they can see |
|---|---|
| **A student** | Only their own records |
| **A teacher** | Only students in classes they are listed as teaching |
| **A building administrator** | Students at the schools they are assigned to |
| **The site administrator** (Jake Wilson) | Everything, in order to maintain the site |
| **Anyone else** | Nothing |

Staff accounts work only if they have been set up by the site administrator,
are marked active, and are assigned a specific role. A student account cannot
grant itself staff access.

Before their students use TypeThatBook, each staff member confirms that their
school has approved it and consents on parents' behalf under COPPA. The exact
wording they agreed to is saved with the date, and the record cannot be edited
afterward.

## 5. Other services involved

| Service | What it receives | Why |
|---|---|---|
| **Google Firebase** (Google LLC) | All of the information in section 2 | Storing it, and signing students in with their school accounts |
| **Google reCAPTCHA**, through Firebase App Check (Google LLC) | Technical information about the browser and device | Confirming that requests to the database come from the real TypeThatBook site, not from a script attempting to misuse it |
| **GitHub Pages** (GitHub, Inc.) | The standard information any web server receives when a page loads | Serving the site's pages |

Fonts are served from TypeThatBook itself rather than from an outside font
service, so no other company is contacted when a student loads a page.

The staff-only administration page loads one code library (JSZip) from
cdnjs.cloudflare.com. Students never use that page.

## 6. How long information is kept

**Typing records are kept while a student is actively using TypeThatBook, and
deleted after 24 months with no activity.**

Computer science is taught in nine-week rotations, so a student may go more than
a year between one grade's rotation and the next. Keeping records for 24 months
after a student's last activity means a student who returns in a later grade keeps
their lesson progress, while the records of students who have left the school are
removed.

A school or parent may also ask for a student's information to be deleted at any
time; see section 7.

The site administrator runs a retention check every quarter. It looks
at every student account — skipping staff accounts — and finds those with no
typing of any kind in the last 24 months, counting practice, lessons and games
alike. Accounts with no typing ever recorded are never removed automatically,
since they may belong to a new student who has not started yet; those are
reviewed individually. Nothing is deleted until the administrator confirms.

## 7. Deleting a student's information

When the school, or a parent or guardian through the school, asks for a student's
information to be deleted, the site administrator removes it within 30 days.
This includes the student's account, typing records, lesson progress, reading
positions and game scores.

The site administrator does this with a delete tool on the reports page. The tool
first lists every record it will remove, then requires the student's email
address to be typed exactly before anything is deleted, so the wrong student
cannot be removed by accident. Two final steps — removing the student's sign-in
account and one internal usage-limit record — are done in the Firebase console,
because web pages are not permitted to delete another person's account.

## 8. How the information is protected

- **Every read and write is checked** by Firestore Security Rules (section 4).
- **Requests must come from the real site.** Firebase App Check rejects database
  requests that do not come from TypeThatBook.
- **All traffic is encrypted** in transit (HTTPS), and Google encrypts stored data.
- **Sign-in is through school Google accounts.** TypeThatBook never sees or stores
  a password.
- **Staff access is limited** to the students each person needs to see.
- **The security rules are tested.** The repository includes automated tests that
  check the rules refuse access they should refuse.
- **Changes are reviewed** before they go live, and every change is recorded in
  this repository's history.

## 9. If something goes wrong

If the site administrator learns that student information may have been accessed
by someone who should not have it, he will:

1. Stop the problem as quickly as possible — for example by locking down the
   security rules or disabling affected accounts.
2. Notify the district's technology department promptly, so the district can meet
   its own obligations to families.
3. Work out what information was involved and which students were affected.
4. Fix the cause, and record what happened and what was changed.

## 10. Review

This program is reviewed at least once a year, and whenever TypeThatBook starts
collecting a new kind of information or starts using a new outside service.

---

*Questions about this document, or requests to see or delete a student's
information, should go to the contact at the top of this page.*
