# Round 135 (Tory) — 26 files — privacy, part one

⚠️ **Assumes Round 134 is deployed.** List derived by diffing against the 133 + 134
packages, not from memory.

## ⚠️⚠️ Upload the `fonts/` folder FIRST

Every page now loads `fonts/fonts.css` instead of Google Fonts. If the HTML goes up
before the folder does, every page falls back to plain system fonts until it
arrives. Nothing breaks — it just looks wrong for a minute.

| what | files |
|---|---|
| **`fonts/`** — upload first | 7 `.woff2` fonts, `fonts.css`, 3 licence files |
| **`SECURITY.md`** — NEW | the written security program |
| 8 HTML pages | the Google Fonts `<link>` swapped for `fonts/fonts.css`. ⭐ **Nothing else changed in any of them** — verified by diff |
| `tests/self-hosted-fonts-test.mjs` | NEW, 30 assertions |
| `tests/staff-tokens-test.mjs` | D1 now accepts the local stylesheet |
| `tests/run-all-tests.mjs` | registers the new harness (107 → 108) |
| `HANDOFF.md` / `CHANGELOG.md` / `ROADMAP.md` | §35, the privacy track 135a–d |

## Before you share SECURITY.md

Three things only you can fill in or confirm:

1. **Your contact email** — there's a placeholder at the top.
2. **24 months** for retention (§6) — see the reasoning in the reply.
3. **30 days** for deletion requests (§7) — a promise, so make sure you're
   comfortable with it.

Two items are honestly marked **Planned** — the delete tool and the retention
sweep. That's deliberate: a reviewer trusts a document that says what's not done
yet far more than one that claims everything.

## Verify

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 108 HARNESSES PASS**. Then open any page and check the typewriter
font still looks like Courier Prime, not Courier New.
