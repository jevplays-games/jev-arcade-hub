# Game rename cutover and 301 redirects

The nine games moved to new names and subdomains (jevplays-games/jev-arcade-hub#8). This file is the runbook, so
the redirects and the order they go live in are not tribal knowledge. **Nothing here is applied by code in this
repo.** Every step below is a production change in Cloudflare, the Discord Developer Portal or the GoDaddy panel,
made by hand after owner approval.

## Host map

| Pre-rename host (301 source) | New host (301 target) | Game | Runs on |
| --- | --- | --- | --- |
| `tic-tac-toe.jevplay.games` | `tic-tac-typed.jevplay.games` | Tic-Tac-Typed | Cloudflare Worker |
| `connect-four.jevplay.games` | `choice-four.jevplay.games` | Choice Four | Cloudflare Worker |
| `checkers.jevplay.games` | `typecheckers.jevplay.games` | Typecheckers | Cloudflare Worker |
| `dots-and-boxes.jevplay.games` | `box-score.jevplay.games` | Box Score | Cloudflare Worker |
| `guess-who.jevplay.games` | `noul-who.jevplay.games` | Noul Who | Cloudflare Worker |
| `mastermind.jevplay.games` | `typecrack.jevplay.games` | Typecrack | Cloudflare Worker |
| `minesweeper.jevplay.games` | `safesweep.jevplay.games` | SafeSweep | Train, Cloudflare Tunnel (`deploy/train/`) |
| `sudoku.jevplay.games` | `typedoku.jevplay.games` | Typedoku | Train, Cloudflare Tunnel (`deploy/train/`) |
| `2048.jevplay.games` | `slide-score.jevplay.games` | Slide Score | Cloudflare Worker |

The hub (GoDaddy Node, `server.js`) never sees game-subdomain traffic, so the redirects belong in Cloudflare, not
in `server.js`.

## How the hub behaves during the move

`games.json` already lists the new slugs and names, and each row carries `legacySlug` (the pre-rename slug). While a
row has `legacySlug`, its card links to `https://<legacySlug>.jevplay.games`, the host that answers today, and
`/api/status` probes that host. So the hub can ship first and the nine games can follow in any order without a
broken card. Resolution order (`lib/catalog.js`):

1. `GAME_URL_<NEW_SLUG>` env var, e.g. `GAME_URL_NOUL_WHO`
2. `GAME_URL_<OLD_SLUG>` env var, e.g. `GAME_URL_GUESS_WHO` (an override already set on GoDaddy keeps working)
3. `https://<legacySlug>.<HUB_BASE_DOMAIN>` while the row has `legacySlug`
4. `https://<slug>.<HUB_BASE_DOMAIN>`

Why the default is the old host and not an env var: an env var that is forgotten breaks a card; a default that is
left in place too long still works, because the old host 301s to the new one. Pointing a card at the old host is
never broken, before or after cutover; pointing it at a new host that is not live yet is.

## Per-game cutover, in this order

For one game (`<old>` → `<new>`):

1. **New host live.** Deploy the renamed game so it answers on `https://<new>.jevplay.games` (new worker route or
   tunnel ingress) **while keeping the old route**. Games serve both hostnames until cutover.
   Check: `curl -sI https://<new>.jevplay.games/` returns a status under 500.
2. **Discord.** In the Developer Portal for that app: rename the app, set the Activity URL mapping `/` →
   `<new>.jevplay.games`, the Interactions Endpoint URL → `https://<new>.jevplay.games/api/discord/interactions`
   and the OAuth2 redirect → `https://<new>.jevplay.games/api/auth/discord/callback`. These are `POST` and redirect
   targets: a 301 re-issues a `POST` as `GET`, so they must move **before** step 4.
3. **Hub.** Point the card at the new host: set `GAME_URL_<NEW>=https://<new>.jevplay.games` in GoDaddy
   (Settings > Environment variables, then Publish), or delete `legacySlug` from the row in `games.json` and release
   the hub. Do the `games.json` edit eventually either way and then remove the env var.
4. **Redirect rule.** Add a Cloudflare redirect for `<old>.jevplay.games` (Bulk Redirects, or one Single Redirect
   rule per host): status **301**, preserve path, preserve query string, include subdomains off.
   Single Redirect expression and target:

   ```
   (http.host eq "<old>.jevplay.games")
   concat("https://<new>.jevplay.games", http.request.uri.path)   # with "Preserve query string" on
   ```

   Keep a **proxied** DNS record for `<old>.jevplay.games` (orange cloud), or the rule never fires.
5. **Verify** before touching the old route:

   ```sh
   curl -sI "https://<old>.jevplay.games/some/path?x=1"
   # HTTP/2 301
   # location: https://<new>.jevplay.games/some/path?x=1
   ```

6. **Old route.** Only after step 5 passes, remove the old worker route (or tunnel ingress for SafeSweep and
   Typedoku). Removing it earlier leaves a window where the old host answers with an error.

## Hub assets that keep their old path

- `public/brand/og/guess-who.png` keeps being served next to `og/noul-who.png` (same image for now; #9 regenerates
  it) so cached social cards and the pre-rename Noul Who page's `og:image` do not 404. Drop it once
  `noul-who.jevplay.games` is live with `og:image` = `https://jevplay.games/brand/og/noul-who.png` and the old page
  has been redirecting for a while.

## Not verified

- That the `jevplay.games` zone is on Cloudflare (inferred from the wrangler routes and the tunnel).
- That the Cloudflare plan allows nine redirect rules (Bulk Redirects needs one list and one rule for all nine).
- That Discord accepts a new Interactions Endpoint URL on the same app without other changes.
