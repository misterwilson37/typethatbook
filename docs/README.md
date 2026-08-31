# docs/

<!-- docs/README.md v1.1.0 — Round 17 (Linotype). New file. This is a map, not a
     second copy of anything: every line below points at a file and says what it is
     good for. Round 13 and Round 14 both burned time on document maps that listed
     files which were not in the repo. Everything listed here is in this folder.

     v1.1.0 — Round 55: registered TEACHER-GUIDE.md, the first teacher-facing
     document in the repo. ⚠️ It is listed under Current with the rest, but it is
     a different KIND of document and its row says so — a maintainer who edits it
     like the others will write developer prose into the one file that must not
     have any. -->

Reference material. Nothing here is served or deployed; it is what you read before
changing something.

`README.md` and `HANDOFF.md` stay at the repo root on purpose — they are the two
entry points, and a reader who has to open a folder to find the handoff will not.

## Current

| File | Read it when |
|---|---|
| `DESIGN-TELEMETRY.md` | **Before touching anything that counts time.** The forward plan: sessions become the single append-only source of truth and every total derives from them. §2 is verification-only, each claim read out of shipped source. §7 is the build order — steps 1 and 1.5 shipped in Round 13, step 2 is next and closes a live data-loss path. §8 is the list of things that must not happen. |
| `README-SESSION-LOGGING.md` | You are working on session history, the week-counter audit, or the ID stamp. Companion to `HANDOFF.md`. |
| `TTL-GUIDE.md` | You are changing retention or looking at the Firestore bill. Console runbook for the two TTL policies and the three composite indexes. ⚠️ TTL lives in the **Google Cloud** console, not the Firebase one — that trips everyone. |
| `SCALE-PLAN.md` | You are about to assume something about cost or load at district scale. The 7,000-student model. ⚠️ Read its header box: statuses were corrected and its Security section's premise was false. |
| `TEACHER-GUIDE.md` | ⭐ **You are a teacher, or you are about to change something a teacher can see.** The reports panel in a teacher's words: pulling a report, what the error-rate column and flag icons mean, deleting a run, and clearing mastery. ⚠️ The only document here NOT written for whoever is editing the code — keep it that way. Its maintainer footnotes map each section back to its roadmap item. |
| `PEDAGOGY-AUDIT.md` | You are changing lesson mode and want to know why students stalled in it the first time. |

## archive/

Superseded documents, kept for their reasoning and not for their conclusions. Each
one carries a warning header explaining what in it is wrong; **that header is the
only thing that makes keeping the file safe**, so do not strip one.

| File | Status |
|---|---|
| `MULTITENANCY.md` | ⚠️ **SUPERSEDED.** A Round 1 design doc specifying roles in Firebase Auth custom claims. That design was built and then deliberately reversed — `firestore.rules` v2.0.0 moved roles into `staff/{uid}` documents — and this file is the probable origin of `firestore-rules.test.mjs` seeding the wrong thing. Two of its arguments are still load-bearing and appear nowhere else, which is why it survives. **`README.md` and `HANDOFF.md` both said this file was deleted in Round 14. It was not.** Round 17 moved it here rather than deleting it, because a document three rounds of notes describe as gone is exactly the document someone will go looking for; now the folder name answers the question. If you want it actually gone, delete it deliberately — git history is the archive. |
