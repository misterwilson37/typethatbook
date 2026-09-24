# Round 138 (Plantin II) — 12 files — the privacy policy

⚠️ **Assumes Round 137 (cumulative) is deployed** — you confirmed it is. List
derived by diffing against the 137 package.

| file | what changed |
|---|---|
| **`privacy.html`** | ⭐ NEW — the privacy policy, for parents |
| 6 HTML pages | one line each: a **Privacy Policy** link in the footer. Nothing else changed — verified by diff |
| `tests/privacy-policy-test.mjs` | ⭐ NEW, 23 assertions |
| `tests/run-all-tests.mjs` | registers it (110 → 111) |
| `HANDOFF.md` / `CHANGELOG.md` / `ROADMAP.md` | §38 |

## ⚠️⚠️ Before you show it to anyone: three blanks to fill in

Open `privacy.html`, find **"Who runs TypeThatBook"**, and replace:

* `[SCHOOL NAME]`
* `[SCHOOL MAILING ADDRESS]`
* `[SCHOOL TELEPHONE]`

COPPA requires the operator's address and phone number in the policy. The
school's are the right ones — nobody expects a teacher's home address. The test
suite prints a note for each blank until they're gone.

## The policy links to SECURITY.md

"How it is protected" links to `./SECURITY.md` on your own site. That file came
in Round 137, so it's already up. On GitHub Pages it'll show as plain text, which
is fine for a reviewer.

## Verify

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 111 HARNESSES PASS**, plus three notes about the blanks until you
fill them in.
