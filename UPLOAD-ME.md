# Round 142 — the privacy work, complete — replaces 138 through 141

⚠️ **Assumes Round 137 (cumulative) is deployed.** Everything from 138–141 is in
here; skip those zips.

## ⚠️⚠️ Order

**1. Rules first.** `firebase/firestore.rules` is now **v2.15.0** → Firebase console
→ Firestore → Rules → paste → Publish. Without it, the checkbox can't save and
teachers will see "Could not save your confirmation."

**2. Everything else.**

## What's in here

| file | what |
|---|---|
| `firebase/firestore.rules` | **v2.15.0** — the write-once consent records |
| `reports.html` | the consent checkbox, asked once of every staff member |
| `privacy.html` | the Privacy & Data Policy — now also says teachers confirm consent, and the database is in the US |
| `SECURITY.md` | same additions |
| `site-nav.js` + 6 HTML pages | the policy link in every footer and the main menu |
| `tests/…` | `coppa-attestation-test.mjs` (new), `privacy-policy-test.mjs`, `student-purge-test.mjs` |
| `HANDOFF.md` / `CHANGELOG.md` / `ROADMAP.md` | through §42 |

## When you open reports

You'll get the checkbox too. **Don't tick it until your principal has said yes** —
the statement says your school has approved TypeThatBook, and for your own classes
she's the one who can say that. Click **Not yet** in the meantime; it records
nothing and asks again next visit.

To see who has confirmed: Firebase console → Firestore → `coppaAttestations`. Each
record shows the teacher's email, the exact wording and the date.

## Still to fill in

The policy has no address, phone or email yet. Send them over once you've decided.

Expect **ALL 112 HARNESSES PASS**.
