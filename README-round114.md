# README-round114.md — how to rebuild Round 114 from scratch

For Jake and future-Jake. Round 114 (Carriage), 2026-09-10. Everything here is
`arcade.html` and its three modules; nothing touches Firestore, the grade path or
student data.

**Deploy stamp to expect: `arcade v3.14.0`** in the badge at the top right of the
arcade page. Read it before reporting a bug against this round.

---

## What was broken, in one line each

1. **Deadline had no console in arcade mode.** The page handed side canvases to
   Escape Key and Shatter and forgot Deadline. The panels themselves were fine.
2. **Shatter was missing from the dropdown.** One stale `unbuilt: true` flag in
   the registry, eleven rounds after the game was finished.
3. **A blank 104px box below the monster queue.** The threat board is Deadline's
   only, and its canvas sat empty on the other two games.
4. **"— just for fun" on two of three games.** Nothing on this page is saved, so
   the label sorted games into serious and unserious for no reason.

Plus two found in the once-over: the `<h1>` always said DEADLINE, and the note
under the frame claimed your typing time isn't counted, which stopped being true
in Round 102.

---

## The files, and the one idea behind the changes

Eight files. Four ship to the site, four are harnesses.

| file | version | ships? |
|---|---|---|
| `arcade.html` | 3.14.0 | yes |
| `game-names.js` | 1.2.0 | yes |
| `game-escape.js` | 2.2.0 | yes |
| `game-draw.js` | 1.12.0 | yes |
| `tests/arcade-panels-test.mjs` | 1.4.0 | no |
| `tests/arcade-versions-test.mjs` | 1.1.0 | no |
| `tests/game-assumptions-test.mjs` | 1.1.0 | no |
| `tests/undefined-calls-test.mjs` | 1.4.0 | no |

**The one idea:** three of the four bugs were *the same quantity written down in
two places*, where the second copy went stale somewhere nothing could check it.

* The console wiring was written twice — once per launch path — and the
  free-play copy forgot a game.
* The wave-queue row count was written twice — once in the view, once in the
  drawing code — and agreed only by luck.
* Shatter's built-or-not status was written twice — once in the registry, once in
  a test asserting the registry — so the test defended the stale copy.

Every fix collapses the pair to one record. That is Rule 9 applied to something
other than a Firestore field.

---

## To rebuild it

### 1. `game-names.js` — make the wiring a value

Delete `unbuilt: true` from the `shatter` entry. Add a `panels` field to all
three games describing the option name their view accepts for the left panel, and
whether they have a threat board:

```js
escape:   panels: { left: 'previewCanvas', threat: false }
deadline: panels: { left: 'radarCanvas',   threat: true  }
shatter:  panels: { left: 'panelCanvas',   threat: false }
```

Add two exported functions. `panelOptionsFor(id, els)` returns the options object
to spread into a view's `mount()`; `usesThreatBoard(id)` reads the same `threat`
flag.

Three rules on that function, all load-bearing:

* **It touches no DOM API.** Elements arrive as plain values, which is the only
  reason a harness can call it. This is the whole point of extracting it.
* **A missing element yields a missing key, never `undefined`.** The views test
  `opts.gaugeCanvas || null`, so an explicit `undefined` works today and hides a
  genuinely missing element tomorrow.
* **An unknown id returns `{}`.** A game this build has never heard of gets no
  canvases rather than Deadline's.

### 2. `arcade.html` — delegate to it

Both launch paths (`play()` for lesson runs, `playFree()` for arcade) replace
their hand-written option lists with `...panelOptionsFor(id, PANEL_ELS())`.
`PANEL_ELS()` is a function, not a constant, because `#stageWrap` is hidden until
a game mounts and because `minutes` must stay a getter so BANKED climbs during
play rather than freezing at press-play.

Then:

* `showThreatBoard(on)` toggles `.no-threat` on `#radar-col`; CSS hides
  `#threat-canvas` with `display:none`. Call it from both paths with
  `usesThreatBoard(...)` — never with an id comparison of its own, or the page
  gets a second opinion about which games have a threat board.
* `fillGames()` labels options with `titleOf(id)` and nothing else.
* `applyPageChrome()` sets the `<h1>`, `document.title` and the blurb from the
  chosen game. Call it from `applyGameMode()`, **not** from the game dropdown's
  own listener — the blurb depends on `isFreePlay()`, which the WORDS row can
  change without the game changing.
* `savedNote()` returns the one sentence about what is kept, and both gate panels
  call it. Delete the claim from the paragraph under the frame entirely.
* Add `game-names.js` to the build panel. It stopped being a list of strings; a
  wrong answer in `panelOptionsFor()` is a blank panel with no error, so its
  version has to be readable from a classroom.

### 3. `game-draw.js` — one row count, derived

In `drawWavePreview()`, delete the `slice(0, 4)` at the top. Compute the budget
once, and slice to what fits:

```js
const ROW_MIN = 48;
const budget  = H - top - pad - tipH;
const room    = Math.max(1, Math.floor(budget / ROW_MIN));
const waves   = (o.waves || []).slice(0, room);
const rowH    = Math.max(ROW_MIN, budget / waves.length);
```

The floor and the budget must be the same two numbers `rowH` uses, or the panel
draws a row it has already decided it has no room for. `tipH` is still reserved
**before** the rows are sized — that is Round 112's fix and it stays.

### 4. `game-escape.js` — offer a fifth

`board.upcoming(4)` becomes `board.upcoming(5)`. This only shows up because the
threat box beside it is collapsed; without step 2 there is no height to spend.

---

## How it was checked

`node tests/arcade-panels-test.mjs` — 211 assertions. Part I is the new one and
it calls `panelOptionsFor()` for every game rather than reading source text.

**Why that matters:** Part I's first draft counted `gaugeCanvas:` in the page
source. I then put the original bug back — moved the shared options inside the
`shatter` branch, exactly as it shipped — and all 185 assertions passed. The
count stayed at one; it had only moved inside a conditional, which was the whole
bug. A search over text cannot see which branch runs.

So each fix was re-broken deliberately, seven ways, and every one now turns the
suite red:

| put back | assertions that fail |
|---|---|
| Deadline loses its console | 3 |
| page hand-rolls the wiring | 4 |
| Escape Key claims a threat board | 2 |
| two names for one left panel | 2 |
| absent element gives `undefined` | 3 |
| panel's literal row count of 4 | 6 |
| view offers four creatures | 1 |

`drawWavePreview()` had no tests at all before this round. It now draws 5 rows at
full height, degrades to 1 at 200px, keeps the extra-life tip throughout, and
stays inside its canvas at six different heights. The old literal overflowed to
207px inside a 200px box.

`tests/undefined-calls-test.mjs` gained `arcade.html`, which had never been in its
list — about 1,300 lines of inline script, the largest in the repo after
`index.html`. A misspelled identifier there now reports with a line number.

`tests/arcade-versions-test.mjs` now pins `arcade.html`'s header against
`ARCADE_PAGE_VERSION`. They read 3.7.0 and 3.13.0 respectively — twelve rounds
apart. Round 98 found the same drift, fixed it by hand, and wrote the gap into a
comment rather than closing it.

---

## Two things to know before the next round

**Run `npm install` first.** The full suite reports 10 failures of 93 on a fresh
container and 1 after installing. Nine of them are just absent `devDependencies`
(`acorn`, `acorn-walk`, `jsdom`, `@xmldom/xmldom`, `jszip`) and look identical to
nine broken harnesses. Also: `npm install` rewrites `package.json` — it bumps the
dependency ranges and un-escapes the unicode in the `//` comment blocks. Revert it
before delivering. This round ships it byte-identical to the upload.

**`guest-merge-test.mjs` fails, and it is not mine.** Seven assertions, Part D
only, all cascading from one that finds zero stored records while Parts A–C pass.
It probably means the harness's setup went stale, but it touches student time
merging, so it deserves its own round rather than a guess. Left alone on purpose.
