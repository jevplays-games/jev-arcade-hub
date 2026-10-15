# Re-syncing the shared brand files to the games

The hub owns the two files the nine games share: `public/brand/brand.css` and `public/brand/brand.js`. Change them
here first, then copy them out unchanged and check them by hash. Fonts are not part of a re-sync: Noul Who keeps its
subset Inter (D6) and the other eight keep the snapshot fonts.

| File | Games have now | Hub file to copy |
|---|---|---|
| `public/brand/brand.css` | `55744adb…` (frozen snapshot) | `9353a5912be8e753174d49f9153d1643127ab76e049ff6a0de5f2f8925056cae` |
| `public/brand/brand.js` | `34a9382d…` | `2b6ce07eff06330b48d4fda0d7e9397c7fac2b3efbdabb6429fe3fa62fe6951b` |

**Scope.** The D17 sweep copies `brand.css` only. Two further steps are open orchestrator decisions; the table under
"Measured on the nine art-branch tips" shows what each one adds:

- copying `brand.js` as well;
- removing the game's own `html{scroll-padding-top:…}` from its `game.css`. Seven games have one: Noul Who, Typecrack,
  Box Score, SafeSweep, Tic-Tac-Typed, Typecheckers and Slide Score. Choice Four never had one and Typedoku has
  already removed its own.

No game markup changes are needed. In particular, do not hard-code `https://jevplay.games/` into a game's
`.jv-brand` link: inside a Discord Activity the link must stay on the game's own root, and brand.js rewrites it only
outside a frame.

## What changed against the snapshot

`brand.css` differs from the frozen snapshot `55744adb` in seven places:

1. **D8 chart tokens.** `--chart-jev:#7A4E0B` and `--chart-human:#155A80`.
2. **D14 `--danger`.** It is now `#A8237F`, 4.86 on grey and 6.48 on paper. `--jev`, `--warn`, `--human` and `--ok`
   are unchanged.
3. **D14 Jev strip.** `.jv-panel.is-jev` takes its strip from `--chart-jev`.
4. **Status chip.** Below 600px it wraps to a second line instead of clipping mid-letter. Below 360px its type steps
   down to `--fs-sm`.
5. **Menu sheet takes focus on open.** The opening transition lists `transform` only, so `visibility` flips at once.
   - Before, `focus()` into the sheet was rejected while the sheet was still `hidden`, and focus stayed on the menu
     button behind the modal scrim.
   - A first fix used `visibility 0s`. That still failed under `prefers-reduced-motion`, because the reduce rule turns
     every duration into .01ms, which starts hidden.
   - The reduce rule also gives every element a transition on `all` properties, so the sheet's contents faded their
     inherited visibility in from hidden. Inside the reduced-motion block nothing in the sheet transitions now.
     Typedoku relies on brand.css's rule; the other eight set `transition:none` themselves.
   - This works with the games' current `brand.js`.
6. **Focus clears the sticky header without page jumps.**
   - `.jv-main`, its `[id]` targets, its headings and its focusable controls get
     `scroll-margin-top: header + safe area + 8px`.
   - The rule is never on `html`. `html{scroll-padding-top}` was the first version of this fix, and seven games add one
     of their own. It counts the header's own controls as hidden, so the page jumps whenever focus lands in the
     header: Shift+Tab into it, scripted focus, and closing the menu (which refocuses the menu button). The verifiers
     measured 450 → 24 at 390 and 450 → 0 at 1440.
   - Header controls and the sheet are outside `.jv-main`.
7. **Header focus rings no longer clipped.** From 900px `#jv-controls` scrolls horizontally, so it clipped the rings of
   the controls inside it. It now has ring-sized padding, cancelled by a negative margin and a cap two rings wider, so
   every control sits exactly where the snapshot puts it.

`brand.js` (`34a9382d` → `2b6ce07e`) adds:

- **Keyboard focus nudge.** Chromium does not scroll a control that is already inside the viewport but under the
  header, even with a scroll margin. A `focusin` handler moves the page by exactly the overlap, for `:focus-visible`
  focus only. It never acts for the header, the sheet, the skip link, dialogs, fixed layers or layers stuck to the
  top. A panel stuck to the bottom, such as Typecrack's guess composer, still moves with the page, so it is covered.
- **Closing the menu returns focus to the menu button, without scrolling.**
  - Before, it went back to whatever had focus when the menu opened.
  - Safari does not focus a tapped button, so that could be a control far down the page, and refocusing it jumped
    the page.
- **The brand link goes to `https://jevplay.games/`** outside a Discord frame.
- **A sheet with nothing focusable still takes focus itself.**

## Measured on the nine art-branch tips

Measured on the nine art-branch tips, with each game's real `public/` served statically (its APIs answer 404). The
tool was Playwright Chromium with every non-local hostname failing DNS. The checks were:

- `npm test`, before and after the copy;
- the header at 320, 390, 599, 768, 900, 1024, 1280 and 1440;
- menu focus at 390 and 768, with and without reduced motion;
- page moves at 390, 768, 1024 and 1440 on Shift+Tab into the header and on scripted header focus;
- page moves when the menu is closed by keyboard, by pointer, and by an iOS-style tap that leaves focus elsewhere;
- full Tab and Shift+Tab walks at 390, 768, 1024 and 1440, counting stops hidden or partly hidden by the header.

Common results:

- **Tests:** identical before and after in all nine.
- **Header from 600px:** identical in all nine (title, brand, menu and chip boxes, control positions, strip overflow).
  Only the clipping of rings and shadows changed.
- **Status chip below 600px:** never clipped or outside the header.

| Game (tip) | `npm test` | brand.css only (D17) | + brand.js | brand.css + brand.js, game rule removed |
|---|---|---|---|---|
| Noul Who (`474b4fc`) | 104/104, `npm run check` passes | menu focus fixed; own-rule jumps\*; 0 hidden | closes clean; own-rule Shift+Tab and scripted jumps remain | clean |
| Choice Four (`e83c7e6`) | 78/78 | menu focus fixed; the iOS-style close jumps; 7 hidden at 390 and 1 partly at 768 (as before) | clean | clean |
| Typecrack (`532b9ad`) | 112/112 | menu focus fixed; own-rule jumps\*; 0 hidden | closes clean; own-rule Shift+Tab and scripted jumps remain | clean |
| Box Score (`f6a2d3b`) | 85/85 | menu focus fixed; own-rule jumps\*; 0 hidden | as Typecrack | clean |
| SafeSweep (`f3dc1fa`) | 197/197 | menu focus fixed; own-rule jumps\*; 0 hidden | as Typecrack | clean |
| Typedoku (`2fdb081`) | 141/141 | menu focus fixed, also under reduced motion; the iOS-style close jumps; 0 hidden | clean | clean |
| Tic-Tac-Typed (`aab42bc`) | 122/122, `npm run check` passes | menu focus fixed; own-rule jumps\*; 0 hidden | as Typecrack | clean |
| Typecheckers (`7f6bf74`) | 135/135 | own-rule jumps (not on keyboard close); 0 hidden. Focus stayed on the menu button: in this build the sheet held only the sign-in links, which are hidden without auth config | closes clean; the sheet takes focus (empty-sheet fallback); own-rule jumps remain | clean |
| Slide Score (`37ea87c`) | 56/56 | menu focus fixed; own-rule jumps\*; 4 partly hidden at 390 (as before) | closes clean; 0 hidden; own-rule Shift+Tab and scripted jumps remain | clean |

\* "Own-rule jumps" come from the game's own `html{scroll-padding-top}`, which was there before the copy:

- Shift+Tab into the header and scripted header focus scroll the page at all four widths.
- A menu close by pointer or iOS-style tap scrolls it at 390 and 768.
- With brand.css only, a keyboard close scrolls it too. Focus now really enters the sheet, so closing it refocuses
  the menu button, which the game's rule counts as hidden.

"Clean" means:

- menu focus in the sheet;
- no page move on any probe;
- 0 hidden or partly hidden stops in all walks.

Removing the game rule **without** `brand.js` stops the jumps, except the iOS-style close. But it leaves hidden or
partly hidden stops in six games, because Chromium does not scroll a control already inside the viewport and only
brand.js nudges it:

| Game | Stops left hidden or partly hidden |
|---|---|
| Typecrack | 4 at 768 |
| Box Score | 7 partly at 1024 |
| SafeSweep | 4 at 1024; 4 partly at 1440 |
| Tic-Tac-Typed | 7 partly at 390–1024 |
| Typecheckers | 4 partly |
| Slide Score | 5, plus 4 partly, at 390 |

So remove the game rule only together with brand.js.

## Procedure, per game repo

1. Copy `public/brand/brand.css` from the hub over the game's file, plus `public/brand/brand.js` if the orchestrator
   includes it. Check that `shasum -a 256 public/brand/brand.css public/brand/brand.js` prints the hub hashes above.
   Do not copy the fonts.
2. If that decision is taken, and only together with `brand.js`, delete the game's own `html{scroll-padding-top:…}`
   from `public/game.css` in the same commit. brand.css and brand.js replace it. Keeping it keeps the header jumps,
   and its offset adds to brand.css's.
3. **Regenerate the repo's checksum/manifest files in the same commit.** Every game pins the old brand.css and
   brand.js hashes in at least one of them. No test enforces them, so a stale one passes CI silently. The lists were
   checked on all nine art-branch tips:

   | Game | Files to regenerate |
   |---|---|
   | Noul Who (jev-guess-who) | `MANIFEST.json`, `SHA256SUMS`; `npm run check` also rewrites the tracked `reports/static-checks.json` |
   | Choice Four (jev-connect-four) | `MANIFEST.sha256` |
   | Typecrack (jev-mastermind) | `MANIFEST.sha256` |
   | Box Score (jev-dots-and-boxes) | `SHA256SUMS.txt` |
   | SafeSweep (jev-minesweeper) | `MANIFEST.json` |
   | Typedoku (jev-sudoku-analytics) | `SHA256SUMS.txt` |
   | Tic-Tac-Typed (jev-tic-tac-toe) | `SHA256SUMS`, `reports/build-manifest.json` |
   | Typecheckers (jev-checkers-analytics) | `SHA256SUMS` |
   | Slide Score (jev-2048-arcade) | `SHA256SUMS.txt`, `SOURCE_MANIFEST.json`, and `server/build-info.js` via `npm run fingerprint` |

   Then run `git grep -e 55744adb -e 34a9382d` over the repo. It must return nothing for the files you copied.
4. Run the game's tests, and `npm run check` where it exists. Then render at 390 and 1440.

## What the D8 + D14 token changes do per game

Measured by T1a review 2 on the earlier tips with a computed-style diff; not re-measured on the current tips (only
Box Score's row was re-checked). Only `--danger` (magenta → `#A8237F`) and the `.jv-panel.is-jev` strip (amber → `--chart-jev`) change colour.
`--jev`, `--warn`, `--human` and `--ok` are unchanged (D14). No game needs a fix before the re-sync.

| Game | Change | Ratio |
|---|---|---|
| Noul Who | nothing | n/a |
| Choice Four | `.button.danger` text and border | on paper 3.35 → 6.48 |
| Typecrack | `.notice.error` left border (`.notice` is on `--surface`, grey) | on grey 2.51 → 4.86 |
| Box Score | nothing (its turn swatches already use `--chart-*`) | n/a |
| SafeSweep | Jev board-card strip | on grey 1.60 → 5.34 |
| Typedoku | `.text-danger` underline; `.cell.conflict` hatch (ink on it stays ≥ 6.09) | n/a |
| Tic-Tac-Typed | `#service-dot.is-off` | on paper 3.35 → 6.48 |
| Typecheckers | `.danger::before` swatch | on paper 3.35 → 6.48 |
| Slide Score | Jev board-card strip | on grey 1.60 → 5.34 |
