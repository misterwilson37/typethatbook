# Round 166 — requirements as a percentage

**The code is already on `main` — nothing to upload.** ⚠️ **One manual step: the Firestore
rules (v2.19.0).** Until then, setting a *student's* percentage in Reports is refused (it says
so). Class percentages in the Class Manager work without it.

## Order

1. **Firestore → Rules:** paste the whole of `firebase/firestore.rules` (v2.19.0) and **Publish**.
2. Firestore → `settings` → `appVersion` → `nonce` → increase by one.

## How to use it

* **A whole class:** admin → Class Manager → Edit the class → **Speed requirement (%)** and
  **Accuracy requirement (%)**. 70 = easier, 110 = harder, blank = standard. Save.
* **One student:** Reports → choose the student → **Requirements…**. Blank follows the class.
  A student's own number replaces the class's (speed and accuracy separately).
* 70% turns a 20 WPM / 90% run into 14 WPM / 63%; 110% into 22 / 99. Accuracy never goes over
  100%. Library's 15 / 80 gate scales the same way. Students only ever see their own numbers.
* Reports grades each student against their own bar; the new **Adjusted** column (last, also at
  the end of the CSV) shows who has a setting.

## Check

1. Set a test student to 70% / 70% in Reports → Requirements… .
2. As that student, open a School lesson: the card and the result screen show the lower targets
   (e.g. "63%+", "14+"). A run at 15 WPM / 70% that used to fail now passes.
3. Run a report: their Adjusted cell reads "speed 70% · accuracy 70%".

Expect **ALL 124 HARNESSES PASS** and **91 rules tests passing**.
