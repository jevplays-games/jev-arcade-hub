# Re-syncing `public/brand/brand.css` to the games

`brand.css` is shared by the hub and the nine games. Change it here first, then copy it out unchanged and verify it by
hash. The games copied the frozen snapshot `55744adb…`; the current hub file is
`ed22d73f4a80a64a093ee673b06cd0280cf1bc6e0dd55ef227e7881dde1b6b0e` (snapshot + D8 chart tokens + D14).

## Procedure, per game repo

1. Copy `public/brand/brand.css` from the hub over the game's `public/brand/brand.css`. Check:
   `shasum -a 256 public/brand/brand.css` prints the hub hash above.
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

   Then grep the repo for the old hash (`git grep 55744adb`); it must return nothing.
3. Run the game's tests (and `npm run check` where it exists), then render at 390 and 1440.

## What the `ed22d73f…` re-sync changes per game

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
