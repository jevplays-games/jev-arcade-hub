# Discord application settings

Team: jevplay.games. Hub domain: `https://jevplay.games`.

Every app uses the same Terms of Service URL (`https://jevplay.games/terms`) and Privacy Policy URL
(`https://jevplay.games/privacy`), served by this hub. Each app has its own icon, cover art, background and preview
video, all rendered from `art/emblems/<slug>.svg` by the scripts in `art/` (the hub's icon is the hub emblem, `art/out/arcade-icon-1024.png`;
`public/brand/discord-icon-1024.png` is now a copy of it, kept because `scripts/build.mjs` requires that filename). Uploads are manual: follow
`art/UPLOAD-CHECKLIST.md`.

All nine games expose the same two routes:

- Interactions Endpoint URL: `https://<slug>.jevplay.games/api/discord/interactions`
- OAuth2 redirect: `https://<slug>.jevplay.games/api/auth/discord/callback`

Set the Interactions Endpoint URL only once that game is deployed and answering. Discord sends a signed
check when you save it and refuses the URL otherwise. The game must already have its `DISCORD_PUBLIC_KEY`.

Both routes are `POST` or redirect targets, so they must be repointed to the new subdomain in the Developer Portal
**before** the old host's worker route is removed: a 301 turns a `POST` into a `GET`. Order of operations:
`deploy/REDIRECTS.md`.

## Apps

Application IDs do not change when an app is renamed. "Pre-rename subdomain" is the host each game answers on until
its cutover; it then 301-redirects to the new subdomain (`deploy/REDIRECTS.md`).

| App | Application ID | Subdomain | Pre-rename subdomain | Tags |
| --- | --- | --- | --- | --- |
| jevplay.games (hub) | 1554746719227613214 | jevplay.games | (unchanged) | games, puzzle, strategy, board games, launcher |
| Tic-Tac-Typed | 1552421200100065280 | tic-tac-typed.jevplay.games | tic-tac-toe.jevplay.games | three in a row, classic, strategy, board games, games |
| Choice Four | 1552421867057315940 | choice-four.jevplay.games | connect-four.jevplay.games | four in a row, classic, strategy, board games, games |
| Typecheckers | 1552421947541950514 | typecheckers.jevplay.games | checkers.jevplay.games | draughts, classic, strategy, board games, games |
| Box Score | 1552421783792128140 | box-score.jevplay.games | dots-and-boxes.jevplay.games | boxes, classic, strategy, board games, games |
| Noul Who | 1552421506703687741 | noul-who.jevplay.games | guess-who.jevplay.games | deduction, yes or no, puzzle, board games, games |
| Typecrack | 1552421410775765052 | typecrack.jevplay.games | mastermind.jevplay.games | code breaking, deduction, puzzle, logic, games |
| SafeSweep | 1552421309139521628 | safesweep.jevplay.games | minesweeper.jevplay.games | logic, puzzle, classic, grid, games |
| Typedoku | 1552422232234397726 | typedoku.jevplay.games | sudoku.jevplay.games | number puzzle, puzzle, logic, analytics, games |
| Slide Score | 1552422046762278912 | slide-score.jevplay.games | 2048.jevplay.games | sliding tiles, puzzle, tiles, numbers, games |

## Descriptions (max 400 characters)

- **jevplay.games**: The front door to nine browser games you play against Jev: Tic-Tac-Typed, Choice Four, Typecheckers, Box Score, Noul Who, Typecrack, SafeSweep, Typedoku and Slide Score. Pick a game and play from any device.
- **Tic-Tac-Typed**: Three in a row against Jev. Every Jev move is typed and recorded, so you can review how it played.
- **Choice Four**: Four in a row against Jev. Drop discs, line up four, and review the evidence behind each of Jev's choices.
- **Typecheckers**: Jump, king your pieces and outplay Jev, with every move logged and move analytics to review afterwards.
- **Box Score**: Close squares to claim boxes and outscore Jev, with each of Jev's decisions recorded.
- **Noul Who**: Ask yes or no questions and narrow down the hidden character before Jev narrows down yours.
- **Typecrack**: Crack the secret code from feedback alone, and review how Jev approached it.
- **SafeSweep**: Clear the field and trip nothing. A logic puzzle with Jev-assisted play and a record of each decision.
- **Typedoku**: Two boards, one clock, every digit typed: fill the grid so every row, column and box holds each digit once, with analytics on how you solve.
- **Slide Score**: Slide and merge tiles to outscore Jev. A sliding-tile puzzle with Jev play and a record of each decision.

## Activities

All nine games run as Discord Activities (Embedded App SDK). Each app has Activities enabled and the URL
mapping `/` -> `<slug>.jevplay.games`. Until a game's cutover the mapping stays on its pre-rename subdomain (table
above); switch it to the new subdomain in the Developer Portal at cutover, together with the Interactions Endpoint URL
and the OAuth2 redirect. Discord creates a primary Entry Point command when Activities are enabled; the games'
`discord:register` scripts upsert a single command, so they leave it alone.

- Sign-in inside the Activity uses `POST /api/activity/session` on each game (see each repo's `docs/ACTIVITY.md`).
- User-installed apps cannot launch Activities in servers with more than 25 members until the app is
  verified. Install to the server (guild install) for anything larger.
- Verified live: Tic-Tac-Typed (SDK sign-in, bearer session, a full game against Jev), verified before the rename on
  its pre-rename subdomain. The other eight are deployed with the same pattern but have not been launched inside
  Discord yet.
