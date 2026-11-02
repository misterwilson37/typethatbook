# Round 160 — big letters on the skeleton

⚠️ **Assumes Round 159 is deployed.** No Firestore rules change. **One code file changes.**

## Order

1. Upload everything in the zip, keeping the folders. Nothing has to go first.
2. To reach tabs that are already open: Firestore → `settings` → `appVersion` → field
   `nonce` → increase it by one. Open tabs reload within ten minutes.

## What changes

* **Library, Adventure, skeleton hands only:** the letter on the palm is about twice as big with a
  thicker dark outline, so it covers the whole palm of bones. The human hand is unchanged.

## Check

Hard-refresh Library; the footer should read `style.css v3.12.1`. In Adventure with the Skeleton
hand on, type a few letters (an `f`, a `w`, a `g`, a space). The letter should be big and fill the
palm, with a thick dark edge.

Expect **ALL 119 HARNESSES PASS.**
