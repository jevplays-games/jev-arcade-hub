# JEV Arcade Hub

Front door for the nine JEV games. It is a launcher: each card links to that game's own
subdomain (`tic-tac-toe.jevplay.games`, `sudoku.jevplay.games`, …). Every game stays a
separate app with its own Discord application, secrets and origin checks, so nothing in the
games changes.

Zero runtime dependencies, native Node `http`.

```sh
npm run build   # validates games.json and the shipped assets
npm start       # listens on process.env.PORT (default 3000), 0.0.0.0
npm test
```

## Config

Add or rename games in `games.json`. URLs come from `HUB_BASE_DOMAIN` or per-game
`GAME_URL_<SLUG>` overrides (see `.env.example`). `/api/status` probes each game's origin
server-side (cached 60 s) and any response under 500, including a 403 `origin_rejected`, counts as online.

## GoDaddy Node.js hosting

Follows the [upload guide](https://www.godaddy.com/help/upload-my-ai-generated-app-to-godaddy-nodejs-hosting-42987):
root `package.json` with `build` and `start`, port from `PORT`, no `node_modules` in the zip
(build the zip with `npm run zip`-style tooling or by hand), well under 100 MB, one app per upload.

1. `npm test && npm run build`
2. Zip the folder contents (not the folder, no `node_modules`, no `.env`).
3. GoDaddy Node.js Hosting → Upload ZIP → Deploy → check Runtime Logs on the preview URL.
4. Set `HUB_BASE_DOMAIN` (and any `GAME_URL_*`) in Settings, then Publish Now.

The games are deployed separately, one GoDaddy app each, and each is attached to its own
subdomain. The hub never proxies them.
