# Round 137 — CUMULATIVE, 49 files — everything since your original upload

Derived by diffing the whole repo against your original zip, not assembled from
earlier packages. Every file is its final version, so re-uploading one you already
have is harmless. Nothing from the original repo is missing.

---

## ⚠️⚠️ Order matters — three steps

**1. Rules, in the Firebase console.** `firebase/firestore.rules` (v2.14.0) →
Firebase console → Firestore → **Rules** → paste → **Publish**. Without it, the
delete tools stop partway with a permission error.

**2. The `fonts/` folder.** Every page now loads `fonts/fonts.css` instead of Google
Fonts. Upload the folder before the HTML, or pages show system fonts until it lands.

**3. Everything else.**

---

## What's in here, by round

| round | what | main files |
|---|---|---|
| 124–127 | arcade fixes: scatter, ping, ramp, side-panel help, telemetry counters | `game-*.js`, `typing-calibrator.js`, `arcade-telemetry.js`, `escape-board.js` |
| 128–130 | per-run delete fix, student picker, "Unknown" names | `reports.html` |
| 131 | ⚠️ held-Backspace farming stopped; ⏸ flag | `game.js`, `reports.html` |
| 134 | ⭐ Library lesson gate | `game.js` |
| 135 | `SECURITY.md`; fonts self-hosted | `SECURITY.md`, `fonts/`, 8 HTML pages |
| 136 | ⭐ Delete student… | `reports.html`, `firestore.rules` |
| 137 | ⭐ Retention… | `reports.html` |

Plus the harnesses for all of it in `tests/`, and HANDOFF / CHANGELOG / ROADMAP
through §37.

## The two new buttons (you'll see them; teachers won't)

Both sit next to the **Student** dropdown in reports and are super-admin only.

**Delete student…** — pick a student first. It counts every record, then you type
their email exactly, then it deletes, then it gives you two console links to
finish.

**Retention…** — no student needed. It scans for accounts with no typing of any
kind for 24 months, shows you the list, and deletes them after you type
`delete` and the number. Accounts with *no typing ever* are listed separately
and never removed in bulk — they might be brand-new students. Run it once a term.

## Verify

```
npm install acorn jsdom
node tests/run-all-tests.mjs
```

Expect **ALL 110 HARNESSES PASS**.
