# Re-syncing the shared brand files to the games

Two files are shared by the hub and the nine games and are owned here: `public/brand/brand.css` and
`public/brand/brand.js`. Change them here first, then copy them out unchanged and verify them by hash.

| File | Games have now | Hub file to copy |
|---|---|---|
| `public/brand/brand.css` | `55744adb…` (frozen snapshot) | `95b20a25fdfe9dec6314ece3145e6673ece3e024d8cb6c49c937f3b9d27ce071` |
| `public/brand/brand.js` | `34a9382d…` | `773b0a765b1c35a812de489a04a85f4967862df1f03790d8291bbfc1781d9e04` |

`brand.css` is the snapshot plus the D8 chart tokens, D14, the header focus fixes and the status-chip fix below. `brand.js` is the
games' file plus the focus and brand-link fixes below. **No game markup changes are needed**: in particular,
do not hard-code `https://jevplay.games/` into a game's `.jv-brand` link, because inside a Discord Activity
the link must stay on the game's own root (brand.js only rewrites it outside a frame).

### Header fixes (hub#9, final reviews)
- **The mobile menu sheet takes keyboard focus when it opens.** Cause: `.jv-sheet` transitions
  `visibility` over .18s, so right after `is-open` is added it is still `hidden` and `focus()` is rejected;
  focus stayed on the menu button. brand.css makes the open sheet visible at once (hiding still waits for
  the slide-out); brand.js focuses the first visible focusable, or the sheet itself if it has none.
  **brand.css alone fixes it** for the games' current markup; brand.js adds the empty-sheet fallback.
- **The sticky header never hides the focused control:** `html{scroll-padding-top:calc(var(--header-h) +
  var(--sa-t) + var(--s4))}` (brand.css).
- **Header focus rings are not clipped:** from 900px `#jv-controls` scrolls horizontally, so it clipped the
  rings of the tabs and account buttons inside it. It now has ring-sized padding with a matching negative
  block margin, so the header height does not change (brand.css).
- **The header status chip no longer clips mid-letter below 600px** (Choice Four verifier, D2). The chip had
  `overflow:hidden;text-overflow:ellipsis` on a `display:flex` box, where the ellipsis does nothing, and a
  40vw cap, so "WAITING FOR SERVE", "BROWSER PRAC" and the like were cut off. A new block below 600px lets it
  wrap to two lines, drops the cap and stops it shrinking below its longest word; under 360px its type steps
  down to `--fs-sm`. Tested with every game's real header and the longest chip strings at 320, 359, 360, 375,
  390, 414 and 599 px: 0 clipped and 0 truncated (before: 46 of 84 clipped at 320/390/599). The header is
  pixel-identical at 600, 900 and 1440 (brand.css).
- **"jevplay.games home" goes to the hub:** brand.js sets `.jv-brand` to `https://jevplay.games/` when the
  page is not framed; in a Discord Activity it stays on the game's root (brand.js).

Verified in Chromium on Typecrack's real `public/` (rebrand/jev-mastermind-14) and on a test page with its
header: before, focus stayed on the menu button, 6 of 6 header rings were clipped at 1440 and the test page
had 4 focused controls under the header; after, all zero, and the brand link resolves to the hub.

## Procedure, per game repo

1. Copy `public/brand/brand.css` **and** `public/brand/brand.js` from the hub over the game's files. Check:
   `shasum -a 256 public/brand/brand.css public/brand/brand.js` prints the two hub hashes above.
2. **Regenerate the repo's checksum/manifest files in the same commit.** Every game pins the brand.css hash in at
   least one of them. No test enforces them, so a stale one passes CI silently:

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

   Then grep the repo for the old hashes (`git grep -e 55744adb -e 34a9382d`); it must return nothing.
3. Run the game's tests (and `npm run check` where it exists), then render at 390 and 1440.

## What the brand.css token changes do per game (D8 + D14)

Only `--danger` (magenta → `#A8237F`) and the `.jv-panel.is-jev` strip (amber → `--chart-jev`) change. `--jev`,
`--warn`, `--human` and `--ok` are unchanged (D14). No game needs a fix before the re-sync.

| Game | Change | Ratio |
|---|---|---|
| Noul Who | nothing | n/a |
| Choice Four | `.button.danger` text and border | on paper 3.35 → 6.48 |
| Typecrack | `.notice.error` left border (`.notice` is on `--surface`, grey) | on grey 2.51 → 4.86 |
| Box Score | nothing | n/a |
| SafeSweep | Jev board-card strip | on grey 1.60 → 5.34 |
| Typedoku | `.text-danger` underline; `.cell.conflict` hatch (ink on it stays ≥ 6.09) | n/a |
| Tic-Tac-Typed | `#service-dot.is-off` | on paper 3.35 → 6.48 |
| Typecheckers | `.danger::before` swatch | on paper 3.35 → 6.48 |
| Slide Score | Jev board-card strip | on grey 1.60 → 5.34 |

The nine art branches (`-<n+1>`) carry the same `55744adb` file and have exactly the same impact as their rename
branches.

**Still a per-game fix under D14:** Box Score's turn-indicator swatches,
`.score-card.is-turn.human/.jev{box-shadow:inset 0 -4px 0 var(--human|--jev)}`, stay `#1F78A8` and amber after the
re-sync because `--human` and `--jev` do not change. The card is `--raised` (paper), where amber is 2.14 and blue 4.83. Point them at `--chart-human` /
`--chart-jev` in that repo's `game.css`.

The header fixes change every game the same way: the menu sheet takes focus on open, focused controls clear
the sticky header, header rings are whole (the desktop tab strip moves 6px inward), and the brand link goes
to the hub outside Discord. Each game should re-render its 390/1440 screenshots after the re-sync.
