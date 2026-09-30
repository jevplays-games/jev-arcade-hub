# Minesweeper and Sudoku on Train

These two games use Node-only SQLite, so they cannot run as Cloudflare Workers.
They run as containers on Train and are exposed through a free Cloudflare Tunnel.

- Tunnel `jevplay-games` routes `minesweeper.jevplay.games` and `sudoku.jevplay.games`
  to the containers over the private `games` network. Nothing is published on host ports.
- Production env per game: `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=3000`,
  `APP_ORIGIN=https://<slug>.jevplay.games`, `DATABASE_PATH=/app/data/<db>.sqlite`,
  `TRUST_PROXY=0`. Sudoku also needs `LAUNCH_SIGNING_KEY` (32+ random chars).
- Behind the tunnel both apps see the tunnel's address as the client, so their per-client
  rate limits apply to all visitors together.
- Update: copy the repo source to `~/jevplay-games/<game>` (excluding `.env`, `node_modules`,
  `data`), then `docker compose up -d --build`.
