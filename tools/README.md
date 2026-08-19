# tools/

<!-- tools/README.md v1.0.0 — Round 17 (Linotype). New file. -->

Developer utilities. None of this is served, none of it runs in a browser, and none
of it is needed to deploy anything.

| File | What it does |
|---|---|
| `audit-versions.mjs` | Runs `versions.js`'s own checks — runtime constant vs header comment, the 60-line header budget, the 6-entry budget, entry ordering — against the files on disk, so version drift is caught without deploying and opening the build panel. `npm run audit:versions`. It defaults to the repo root now that it lives one level down; pass a directory to point it elsewhere. **It is a mirror of `versions.js` and has drifted from it before** — its own header says so. |
| `build-test-epubs.py` | Builds `ttb-test-flat.epub` and `ttb-test-parts.epub`, the two synthetic fixtures in `library/`. Their expected numbers are in `tests/TESTING-ttb-test-epubs.md`. |
| `build-augie-epub.py` | Builds a single named EPUB. Kept because the file it produces is not reproducible from anything else in the repo. |

## Known state

`npm run audit:versions` reports **11 problems**, and has for several rounds. Most
are header-budget overruns — `session-log.js` is at 138 lines against a budget of
60, `hud.js` at 71. That is a documentation-density decision, not a defect, but it
means the same caution applies here as to the test suite: **11 is the accepted
number, so anything other than 11 is news.**
