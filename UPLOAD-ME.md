# Round 148 — names on accounts

⚠️ **Assumes Round 147 is deployed.**

## ⚠️⚠️ Order

1. **Rules first:** `firebase/firestore.rules` is **v2.17.0** → Firebase console →
   Firestore → Rules → paste → **Publish**. If the console shows an error instead of
   publishing, don't force it — send me the message. (It checks syntax before it
   publishes, so a mistake can't break the site.)
2. **Everything else.**

## What changes

* **Each student's name and email are saved on their account** the next time they
  type. As students trickle in over the next few days, the Student dropdown fills
  with real names — no report needed.
* **No student can rename themselves:** the rules only accept the name and email of
  the Google account that's actually signed in.
* **The dropdown remembers today's list** in your browser. After one ⟳, opening an
  empty dropdown again costs no reads. ⟳ always reads fresh.
* **Privacy policy:** checked — no change needed. Names and emails were already
  disclosed; SECURITY.md got a paragraph describing the new detail.

Expect **ALL 117 HARNESSES PASS**.
