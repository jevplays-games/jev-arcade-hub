# SafeSweep and Typedoku on Train

SafeSweep (repo jev-minesweeper until its rename) and Typedoku (jev-sudoku-analytics) use Node-only SQLite, so they cannot run as Cloudflare Workers.
They run as containers on Train and are exposed through a free Cloudflare Tunnel.

- Tunnel `jevplay-games` routes `minesweeper.jevplay.games` and `sudoku.jevplay.games` (pre-rename hosts)
  to the containers over the private `games` network. Nothing is published on host ports. Only if option 2 below
  (keep Train) is chosen: at cutover add `safesweep.jevplay.games` and `typedoku.jevplay.games` to the same tunnel
  before the old hosts are redirected (`deploy/REDIRECTS.md`).
- The compose service, directory and volume names below (`minesweeper`, `sudoku`, `*-data`) are deliberately
  unchanged: renaming a volume would orphan the SQLite data. Rename them only with a data migration.
- Production env per game: `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=3000`,
  `APP_ORIGIN=https://<slug>.jevplay.games`, `DATABASE_PATH=/app/data/<db>.sqlite`,
  `TRUST_PROXY=0`. Sudoku also needs `LAUNCH_SIGNING_KEY` (32+ random chars).
- Behind the tunnel both apps see the tunnel's address as the client, so their per-client
  rate limits apply to all visitors together.
- Update: copy the repo source to `~/jevplay-games/<game>` (excluding `.env`, `node_modules`,
  `data`), then `docker compose up -d --build`.

## Discrepancy: this compose file no longer matches the game repos (decision needed)

Checked against the local clones' `origin/main` on 2026-10-14. Nothing here was changed on Train or in Cloudflare.

- **No Dockerfile.** `build: ./minesweeper` and `build: ./sudoku` expect a Dockerfile in each copied repo. Both repos
  deleted theirs on 2026-09-30 when they moved to Cloudflare Workers + D1 (jev-minesweeper `e89b88b`,
  jev-sudoku-analytics `7c01201`). A fresh `docker compose up -d --build` from current `main` fails; the running
  containers (if any) are built from an older checkout.
- **SafeSweep binds loopback only.** jev-minesweeper `server/main.js` is now a local dev shim: `createApp` defaults
  `host = '127.0.0.1'` and throws unless `APP_ORIGIN` is a loopback host ("The local shim binds to loopback only.
  Deploy the Worker"). It ignores `HOST=0.0.0.0` above, so cloudflared on the `games` network could not reach it even
  with a Dockerfile, and `APP_ORIGIN=https://…jevplay.games` makes it refuse to start.
  (Typedoku's `local/server.js` still honours `HOST` and binds `0.0.0.0` in production, but has no Dockerfile either.)
- **Both hosts are also claimed by Workers.** Each repo's `wrangler.jsonc` routes its pre-rename host as a Workers
  custom domain (`minesweeper.jevplay.games`, `sudoku.jevplay.games`). A hostname resolves to one target: either the
  Worker custom domain or this tunnel's CNAME, not both. Which one is live today is not verified here.

**Decision needed (owner/orchestrator), before the SafeSweep/Typedoku cutover in `deploy/REDIRECTS.md`:**

1. **Retire Train for these two games (recommended if the Workers are live).** Confirm `curl -sI` on both hosts is
   answered by Workers (`cf-ray`, no tunnel), then remove the two tunnel ingress rules and stop the stack. The
   cutover then follows the Cloudflare Worker path like the other seven: add `safesweep.jevplay.games` /
   `typedoku.jevplay.games` custom domains, 301 the old hosts. This directory becomes historical and can be deleted.
2. **Keep Train.** Restore a Dockerfile in each repo and a production Node entry point for SafeSweep that binds
   `0.0.0.0` and accepts a non-loopback `APP_ORIGIN`, remove the Workers custom domains for these hosts, and add the
   new hostnames to the tunnel at cutover. That is per-game code work, outside this repo.

Until one is chosen, do not run `docker compose up --build` here and do not add tunnel ingress for the new hostnames.
