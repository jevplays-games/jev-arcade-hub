# Discord application settings

Team: JevPlay.Games. Hub domain: `https://jevplay.games`.

Every app uses the same Terms of Service URL (`https://jevplay.games/terms`) and Privacy Policy URL
(`https://jevplay.games/privacy`), served by this hub, and the same icon (`public/brand/discord-icon-1024.png`).

All nine games expose the same two routes:

- Interactions Endpoint URL: `https://<slug>.jevplay.games/api/discord/interactions`
- OAuth2 redirect: `https://<slug>.jevplay.games/api/auth/discord/callback`

Set the Interactions Endpoint URL only once that game is deployed and answering. Discord sends a signed
check when you save it and refuses the URL otherwise. The game must already have its `DISCORD_PUBLIC_KEY`.

| App | Application ID | Subdomain | Tags |
| --- | --- | --- | --- |
| JevPlay Arcade (hub) | 1554746719227613214 | jevplay.games | games, puzzle, strategy, board games, arcade |
| Tic-Tac-Toe | 1552421200100065280 | tic-tac-toe.jevplay.games | tic tac toe, classic, strategy, board games, games |
| Connect 4 | 1552421867057315940 | connect-four.jevplay.games | connect four, classic, strategy, board games, games |
| Checkers | 1552421947541950514 | checkers.jevplay.games | checkers, classic, strategy, board games, games |
| Dots & Boxes | 1552421783792128140 | dots-and-boxes.jevplay.games | dots and boxes, classic, strategy, board games, games |
| Guess Who | 1552421506703687741 | guess-who.jevplay.games | guess who, deduction, puzzle, board games, games |
| Mastermind | 1552421410775765052 | mastermind.jevplay.games | mastermind, deduction, puzzle, code breaking, games |
| Minesweeper | 1552421309139521628 | minesweeper.jevplay.games | minesweeper, puzzle, classic, logic, games |
| Sudoku | 1552422232234397726 | sudoku.jevplay.games | sudoku, puzzle, logic, analytics, games |
| 2048 | 1552422046762278912 | 2048.jevplay.games | 2048, puzzle, arcade, tiles, games |

## Descriptions (max 400 characters)

- **JevPlay Arcade**: JevPlay Arcade is the front door to nine browser games you play against JEV: Tic-Tac-Toe, Connect Four, Checkers, Dots and Boxes, Guess Who, Mastermind, Minesweeper, Sudoku and 2048. Pick a game and play from any device.
- **Tic-Tac-Toe**: Play Tic-Tac-Toe against JEV. Three in a row wins, and every opponent decision is recorded so you can review how it played.
- **Connect 4**: Play Connect Four against JEV. Drop discs, line up four, and review the evidence behind each opponent move.
- **Checkers**: Play Checkers against JEV. Jump, king your pieces and outmaneuver the opponent, with move analytics to review afterwards.
- **Dots & Boxes**: Play Dots and Boxes against JEV. Close squares to claim boxes and out-score the opponent, with each opponent decision recorded.
- **Guess Who**: Play Guess Who against JEV. Narrow down the hidden character with yes/no questions before it narrows down yours.
- **Mastermind**: Play Mastermind against JEV. Crack the secret code from feedback alone, and review how the opponent approached it.
- **Minesweeper**: Clear the field without hitting a mine. A logic puzzle with JEV-assisted play and a record of each decision.
- **Sudoku**: Fill the grid so every row, column and box holds each digit once, with analytics on how you solve.
- **2048**: Slide and merge tiles to reach 2048. An arcade puzzle with JEV play and a record of each decision.

## Activities

All nine games run as Discord Activities (Embedded App SDK). Each app has Activities enabled and the URL
mapping `/` -> `<slug>.jevplay.games`. Discord creates a primary Entry Point command when Activities are
enabled; the games' `discord:register` scripts upsert a single command, so they leave it alone.

- Sign-in inside the Activity uses `POST /api/activity/session` on each game (see each repo's `docs/ACTIVITY.md`).
- User-installed apps cannot launch Activities in servers with more than 25 members until the app is
  verified. Install to the server (guild install) for anything larger.
- Verified live: Tic-Tac-Toe (SDK sign-in, bearer session, a full game against JEV). The other eight are
  deployed with the same pattern but have not been launched inside Discord yet.
