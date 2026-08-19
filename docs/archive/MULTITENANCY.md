# TypeThatBook — Schools, Classes, and Who Sees Whom

<!-- MULTITENANCY.md v1.1.0 -->
<!-- v1.1.0 — Round 6 (Noiseless): recovered from outside the repo and committed WITH
              THIS WARNING HEADER, which is the only reason committing it is safe.
              Not one word of the original text was changed. It is preserved because
              two of its arguments are still load-bearing and appear nowhere else —
              see "What is still true" below — and because it is the historical record
              of a design decision that was correctly reversed.
              ⚠️ Its central recommendation was rejected, and this document is the
              probable origin of firestore-rules.test.mjs being wrong: that suite
              seeds roles as auth-token claims, which is what this file specifies and
              not what the rules do. If you are here to write rules or rules tests,
              read firestore.rules' header comment instead. -->

> # ⚠️ SUPERSEDED. READ THIS BOX BEFORE READING ANY OF THE REST.
>
> **This is a Round 1 design document. The design it recommends was built and then
> deliberately reversed.** Round 3's own document map already called it "superseded
> anyway." It is kept for its reasoning, not its conclusions.
>
> ### What is WRONG, and why it will not come back
>
> **"Where roles must live: Firebase Auth custom claims."** No. `firestore.rules`
> v2.0.0 moved roles into `staff/{uid}` Firestore documents, and that reversal is
> permanent for a structural reason: **claims can only be written by the Admin SDK,
> which requires deploying a Cloud Function, which requires a command line — and this
> project's founding constraint is that Jake deploys by uploading files in a browser.**
> Everything in this file that follows from claims is therefore void:
>
> - the entire security-rules code block below (it gates on `request.auth.token.role`)
> - `setCustomUserClaims()` and the claim-sync callable
> - migration steps 4–5 ("deploy the claim-sync function. Needs the Firebase CLI")
> - the "Jane will need to sign out and back in" toast — the document-based model takes
>   effect immediately, so that advice is not just unnecessary but misleading
> - "Free. Zero document reads to check a role." The shipped model *does* cost a
>   `get()` on admin pages. That was accepted with open eyes; `firestore.rules` v2.1.0
>   then ordered every `allow` expression cheapest-condition-first so a student write
>   can never trigger one.
>
> **"Status: design, not built."** It is built and live. Schools, classes, staff roles,
> `pendingStaffRoles`, the scope picker and the reports class filter all shipped.
>
> **The three-role table is missing the concept that matters most.** The shipped model
> has a per-person **`readScope`** on `staff/{uid}` — `'own_classes'` (default) or
> `'building'` — which is how "admin the whole thing but don't see other people's kids"
> actually got solved. It appears in `firestore.rules`, `staff-admin.js` and
> `reports.html`, and nowhere in this document.
>
> **"Decisions I need from you" is largely answered by the shipped code**, not by Jake:
> co-teachers exist (`teacherUids` is an array), and the class-vs-building question was
> resolved by making it a per-teacher setting rather than a project-wide policy.
>
> ### What is STILL TRUE, and is why this file was worth recovering
>
> 1. **The trimester argument.** 9-week rotations mean a student's `classId` is
>    temporary, so logs must carry their own copy or Trimester 1's reports lose their
>    class attribution the moment Trimester 2 starts. This is *the* reason `classId` and
>    `schoolId` are denormalised onto every log document rather than joined. It reads
>    like redundancy until you need it, and it is not written down anywhere else.
> 2. **The FERPA flag in decision 5.** If this is district-wide rather than one
>    building, teachers in building A reading logs from building B raises questions for
>    the district's data-privacy officer, not for Claude. Still unanswered, still
>    correct to ask. Note Jake works under Tennessee's student-data-privacy statute
>    (T.C.A. § 49-1-708) as well as FERPA.
> 3. **The migration section's shape** — additive fields, absent-means-default, and
>    "treat empty `classId` as *Unassigned* and show it rather than hiding it, because
>    silently dropping historical data is worse than an ugly bucket." Round 5's rules
>    audit fixed an unassigned-student visibility bug that this paragraph predicted.

---

**Status: design, not built.** `game.js` v3.4.0 and `learn.js` v1.1.0 already stamp
`classId` and `schoolId` onto every log document, so the data will be there when the
UI arrives. Everything else below needs your decisions first.

The requirement, as stated: *"school/class groups, with set teachers who control those
buildings. I'll have to admin the whole thing, but I don't need to see any kids but
mine."*

That last clause is the interesting one. It's not a permissions requirement — you
already have permission for everything. It's a **default scope** requirement, which is
a different and much nicer problem to solve.

---

## Why the tenancy fields had to go in now

Both `typing_logs` and `typing_sessions` now carry `classId` and `schoolId`, copied
from the student's user/class document at flush time.

This wasn't scope creep. `reports.html` currently queries `typing_logs` by date range
with no other filter — at full enrollment that's ~47,000 documents per report view
(SCALE-PLAN Problem 4). The fix for that is a `where('classId','==',...)` filter, and
that filter needs the field on the document. Adding it later would have meant a second
migration over the same collection.

**One migration instead of two.** The read-cost fix and the tenancy model wanted the
same schema change, so they got it at the same time.

---

## Data model

Two new collections, three modified.

```
schools/{schoolId}                      NEW
    name              "Ellis Middle School"
    shortName         "EMS"
    active            true

classes/{classId}                       MODIFIED — add schoolId, teacherUids
    name              "3rd Period CS"        (existing)
    dailySeconds      600                    (existing)
    weeklySeconds     3000                   (existing)
    schoolId          "ems"              ← NEW
    teacherUids       ["uid_a","uid_b"]  ← NEW, co-teachers supported
    period            3                  ← NEW, optional, for sorting
    termId            "2026_T1"          ← NEW, optional; see Trimesters below

staff/{uid}                             NEW — the authority on who is what
    email             "jane@sumnerk12.net"
    displayName       "Jane Doe"
    role              "teacher" | "building_admin" | "super_admin"
    schoolIds         ["ems"]            buildings they administer
    classIds          ["cs_3rd_x1a"]     classes they teach
    active            true

users/{uid}                             MODIFIED — add schoolId
    classId           "cs_3rd_x1a"           (existing)
    schoolId          "ems"              ← NEW, denormalised from the class

typing_logs/{uid}_{date}                MODIFIED — already shipped in v3.4.0
typing_sessions/{auto}                  MODIFIED — already shipped in v3.4.0
    classId, schoolId                   ← stamped at flush time
```

`schoolId` is denormalised in three places (user, class, log). That's deliberate.
Normalising it would mean a join on every report query, and joins in Firestore are
client-side reads — the exact thing this whole effort has been about eliminating.

---

## Roles

Three, and the boundaries are about **buildings**, not individuals.

| Role | Can see | Can edit |
|---|---|---|
| `teacher` | students in their own `classIds` | goals for their own classes; class roster |
| `building_admin` | every class and student in their `schoolIds` | classes, rosters, goals in their buildings |
| `super_admin` | everything | everything, including books, lessons, staff roles |

**You are `super_admin` with `classIds` set to your own classes.** That's what makes
"admin the whole thing but don't see other people's kids" work: reports open scoped to
your `classIds` and there's a scope picker to widen it. Full access, sane default.

The scope picker is the whole UX of this feature:

```
Viewing:  [ My classes ▾ ]        ← default for every role
          ├─ My classes           (staff.classIds)
          ├─ Ellis Middle School  (only if schoolIds includes it)
          ├─ Hendersonville MS
          └─ All schools          (super_admin only)
```

### Where roles must live

**Firebase Auth custom claims**, not a Firestore field the client reads.

```js
// One-time, from the functions environment
await admin.auth().setCustomUserClaims(uid, {
    role: 'building_admin',
    schoolIds: ['ems']
});
```

Claims arrive inside the auth token, which means:
- **Free.** Zero document reads to check a role, on every request.
- **Unforgeable.** Signed by Google; a student editing devtools can't grant themselves
  anything.
- **Available in security rules** as `request.auth.token.role`, with no `get()` call —
  and rules `get()` calls are billed as reads.

The `staff/{uid}` document is the human-editable record and the source of truth for the
admin UI. A callable function reads it and syncs claims. **The document is the record;
the claim is the enforcement.** Don't let them drift — sync on every staff edit.

⚠️ Claims are baked into the token at sign-in. After a role change the user needs
`getIdToken(true)` or a fresh sign-in before it takes effect. Worth a toast in the UI:
*"Role updated — Jane will need to sign out and back in."*

### What this replaces

`ADMIN_EMAILS`, currently hardcoded and **duplicated** in `admin.js` line 18 and
`reports.html` line 306. Two arrays that can silently disagree, gating UI only, with no
server-side enforcement whatsoever. Every one of those problems goes away.

---

## Security rules

Rules are where this becomes real. Without them, roles are decoration — any signed-in
student can read every other student's logs today.

```
rules_version = '2';
service cloud.firestore {
  function isStaff()    { return request.auth != null && request.auth.token.role != null; }
  function isSuper()    { return isStaff() && request.auth.token.role == 'super_admin'; }
  function ownsSchool(s) {
    return isSuper() ||
      (isStaff() && request.auth.token.role == 'building_admin' &&
       s in request.auth.token.schoolIds);
  }

  match /databases/{database}/documents {

    // A student owns their own subtree, and nobody else's.
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if isStaff();
      match /{sub=**} {
        allow read, write: if request.auth.uid == uid;
        allow read: if isStaff();
      }
    }

    // Students write only their own daily log — the doc ID enforces it.
    match /typing_logs/{docId} {
      allow create, update: if request.auth != null
                            && docId.split('_')[0] == request.auth.uid;
      allow read:   if isStaff();
      allow delete: if isSuper();
    }

    match /typing_sessions/{id} {
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow read:   if isStaff();
      allow update, delete: if isSuper();
    }

    // Public board. Initials only — no names live here as of game.js v3.3.0.
    match /leaderboard/{uid} {
      allow read:  if request.auth != null;
      allow write: if request.auth.uid == uid || isStaff();
    }

    match /schools/{id} { allow read: if isStaff(); allow write: if isSuper(); }
    match /staff/{id}   { allow read: if isStaff(); allow write: if isSuper(); }

    match /classes/{id} {
      allow read:  if request.auth != null;   // students read their own class goals
      allow write: if isSuper() || ownsSchool(resource.data.schoolId);
    }

    match /books/{b}   { allow read: if request.auth != null; allow write: if isSuper();
      match /chapters/{c} { allow read: if request.auth != null; allow write: if isSuper(); } }
    match /lessons/{l} { allow read: if request.auth != null; allow write: if isSuper(); }
    match /settings/{s}{ allow read: if request.auth != null; allow write: if isSuper(); }

    match /pendingClassAssignments/{email} {
      // A student may read and consume only their own invitation.
      allow read, delete: if request.auth != null && request.auth.token.email == email;
      allow write: if isStaff();
    }

    match /practice_limits/{uid} { allow read, write: if false; }  // functions only
    match /practice_sessions/{id} {
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow read:   if isStaff();
    }
  }
}
```

**Two honest caveats on the above:**

1. **`allow read: if isStaff()` on student data is broader than your stated
   requirement.** Any teacher could read any student's logs if they crafted the query
   by hand. Narrowing that to "only students in my classes" in rules is genuinely
   awkward — Firestore rules can't check "does this student's classId appear in my
   claim's classIds" without a `get()`, which costs a read on every access. The
   practical pattern is: **rules enforce the building boundary, the UI enforces the
   class boundary.** If you want class-level enforcement in rules too, the workable
   approach is putting `schoolId` in the claim and denormalising it onto every log
   (already done), then gating on that. Tell me which level you actually need.

2. **These rules are untested and will break things if I've mis-guessed a write
   path.** `pendingClassAssignments` in particular — `applyPendingClassAssignment()`
   in `learn.js` deletes the doc as the *student*, which the rules above allow, but only
   because I read that code carefully. Deploy to a test project first, or deploy during
   a week you're not teaching.

---

## Trimesters

You run 9-week rotations, 3 per year, ~2,335 students each. A student's class
assignment is therefore **temporary**, and this is the part most likely to bite.

If `users/{uid}.classId` is a single field, then when trimester 2 starts every student
gets reassigned and **trimester 1's reports lose their class attribution** — unless the
logs carry their own copy.

They do. `typing_logs` and `typing_sessions` stamp `classId` at write time, so a
September log keeps saying "3rd Period CS" forever even after that student moves on.
**This is the reason to denormalise rather than join**, and it's worth being explicit
about because it looks like redundancy until you need it.

Optional refinement: `classes/{id}.termId` (`"2026_T1"`) so the admin UI can hide
finished classes without deleting them. Worth it if you want year-over-year comparison;
skippable if you don't.

---

## Migration

Nothing here breaks existing data. Every new field is additive and absent-means-default.

1. **Create `schools/{id}`** — one document per building. Manual, in the console.
2. **Backfill `classes`** — add `schoolId` and `teacherUids` to each existing class.
   You have few enough classes to do this by hand in the Classes tab once the UI
   supports it.
3. **Backfill `users.schoolId`** — a one-time script, or let it happen lazily:
   `loadGoals()` in v3.4.0 already falls back to the class's `schoolId` when the user
   doc lacks one.
4. **Create `staff/{uid}`** for yourself with `role: 'super_admin'`, then sync claims.
5. **Deploy the claim-sync function.** Needs the Firebase CLI.
6. **Deploy rules.** Last, and to a test project first.
7. **Then** delete `ADMIN_EMAILS` from both files.

Old logs will have empty `classId`/`schoolId`. Reports should treat empty as
"unassigned" and show them rather than hiding them — silently dropping historical data
is worse than an ugly bucket labelled *Unassigned*.

---

## Decisions I need from you

1. **Who are the building admins?** Named people, or is it "whoever teaches at that
   school gets building-wide read"? The rules differ substantially.
2. **Class-level enforcement in rules, or building-level?** Building-level is clean and
   cheap. Class-level costs a read per access or a denormalisation. Your call, and it
   depends on how much you trust your colleagues with each other's rosters.
3. **Should teachers be able to create classes,** or only building admins?
4. **Do co-teachers happen?** I modelled `teacherUids` as an array, which costs nothing
   if unused.
5. **Are the ~7,000 students across multiple buildings, or one big building?** This
   changes whether `schools` is load-bearing or ceremonial. "7,000 kids" and "I don't
   need to see any kids but mine" together suggest district-wide — worth confirming,
   because if it's district-wide there are FERPA questions above my pay grade that your
   district's data-privacy officer should weigh in on before teachers in building A can
   read logs from building B.

## What I'd build first

The **scope picker plus a `classId` filter on `reports.html`**, before any of the roles
machinery. It's the piece that delivers what you actually asked for ("don't show me
other people's kids"), it fixes SCALE-PLAN Problem 4 at the same time, and it needs no
Cloud Function deploy — the data's already flowing.

Roles and rules after that, together, in a week you're not teaching.
