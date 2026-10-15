# Game rename cutover and 301 redirects

The nine games moved to new names and subdomains (jevplays-games/jev-arcade-hub#8). This file is the runbook, so
the redirects and the order they go live in are not tribal knowledge. **Nothing here is applied by code in this
repo.** Every step below is a production change in Cloudflare, the Discord Developer Portal or the GoDaddy panel,
made by hand after owner approval.

## Host map

| Pre-rename host (301 source) | New host (301 target) | Game | Runs on |
| --- | --- | --- | --- |
| `tic-tac-toe.jevplay.games` | `tic-tac-typed.jevplay.games` | Tic-Tac-Typed | Worker custom domain |
| `connect-four.jevplay.games` | `choice-four.jevplay.games` | Choice Four | Worker custom domain |
| `checkers.jevplay.games` | `typecheckers.jevplay.games` | Typecheckers | Worker custom domain |
| `dots-and-boxes.jevplay.games` | `box-score.jevplay.games` | Box Score | Worker custom domain |
| `guess-who.jevplay.games` | `noul-who.jevplay.games` | Noul Who | Worker custom domain |
| `mastermind.jevplay.games` | `typecrack.jevplay.games` | Typecrack | Worker custom domain |
| `minesweeper.jevplay.games` | `safesweep.jevplay.games` | SafeSweep | Worker custom domain (Train status: see `deploy/train/README.md`) |
| `sudoku.jevplay.games` | `typedoku.jevplay.games` | Typedoku | Worker custom domain (Train status: see `deploy/train/README.md`) |
| `2048.jevplay.games` | `slide-score.jevplay.games` | Slide Score | Worker custom domain |

Every old host is a Workers **custom domain** (`custom_domain: true` in each game's `wrangler.*` routes), and so is
every new host. A custom domain owns its DNS record: Cloudflare creates the record with the domain and deletes it when
the domain is removed. That is why step 6 below adds a placeholder record in the same change.

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
left in place too long still works: the old host keeps serving the game (step 5) and later 301s to the new one
(step 6). That holds only if steps 5 and 6 are followed: the old custom domain stays until `legacySlug` is gone, and
its removal is paired with a placeholder record. Pointing a card at a new host that is not live yet is always broken.

## Per-game cutover, in this order

For one game (`<old>` → `<new>`):

1. **New host live.** Deploy the renamed game so it answers on `https://<new>.jevplay.games` (a second Worker custom
   domain route, `<new>.jevplay.games`) **while keeping the old one**. Games serve both hostnames until cutover.
   Check: `curl -sI https://<new>.jevplay.games/` returns a status under 500.
2. **Discord.** In the Developer Portal for that app: rename the app, set the Activity URL mapping `/` →
   `<new>.jevplay.games`, the Interactions Endpoint URL → `https://<new>.jevplay.games/api/discord/interactions`
   and the OAuth2 redirect → `https://<new>.jevplay.games/api/auth/discord/callback`. These are `POST` and redirect
   targets: a 301 re-issues a `POST` as `GET`, so they must move **before** step 6.
3. **Hub.** Point the card at the new host: set `GAME_URL_<NEW>=https://<new>.jevplay.games` in GoDaddy
   (Settings > Environment variables, then Publish), or delete `legacySlug` from the row in `games.json` and release
   the hub. Either way, delete `legacySlug` from the row and release the hub before step 6, then remove the env var
   and any `GAME_URL_<OLD>` override still set on GoDaddy.
4. **Redirect rule.** Create the rule now. It may take effect immediately, in front of the still-live custom domain
   (not verified); that is safe because steps 1–3 are done, so it only 301s to a live host. Use **one** of:
   - **Single Redirect** (Rules > Redirect Rules), one rule per old host, status **301**, **Preserve query string** on:

     ```
     (http.host eq "<old>.jevplay.games")
     concat("https://<new>.jevplay.games", http.request.uri.path)
     ```

   - **Bulk Redirects**, one list for all nine hosts, each entry `<old>.jevplay.games` → `https://<new>.jevplay.games`,
     status **301**, with **Subpath matching**, **Preserve path suffix** and **Preserve query string** all on.
     Without Subpath matching and Preserve path suffix, only the bare `/` redirects and every deep link 404s.
5. **Keep the old custom domain for now.** Until `legacySlug` is gone from that row in the released `games.json` and
   step 2 is done, the old host keeps serving the game directly from its Worker custom domain. Cards and Discord
   links that still use it keep working. Do not remove it earlier.
6. **Hand the old host to the redirect, in one change.** Removing the old route (`<old>.jevplay.games` with
   `custom_domain: true` in the game's `wrangler.*`, or Workers & Pages > the worker > Settings > Domains) **deletes
   its DNS record**. With no record, the hostname stops resolving and the step-4 rule never fires. So, in the same
   change, with no gap between:
   1. Remove the old custom domain **by dropping `{ "pattern": "<old>.jevplay.games", "custom_domain": true }` from
      the game repo's `wrangler.*` and deploying** (Typecrack's `wrangler.toml` writes it
      `{ pattern = "mastermind.jevplay.games", custom_domain = true }`). Removing it only in the dashboard (Workers & Pages > the worker >
      Settings > Domains) is not enough: the next `wrangler deploy` re-attaches it from the config, which either fails
      against the placeholder or replaces it, and the old host serves the game again. If you remove it in the
      dashboard for speed, commit the `wrangler.*` change in the same change.
   2. Immediately add a **proxied** (orange cloud) placeholder record for the old host: `AAAA <old> 100::`.
      `100::` is the discard prefix; nothing is ever served from it, it only gives Cloudflare a proxied hostname for
      the redirect rule to run on.
      Do steps 1 and 2 at low traffic. A resolver that looked the host up in the gap may cache NXDOMAIN briefly;
      that clears within the zone's SOA negative TTL, and by then no card or Discord link points at the old host.
   3. Re-run the check:

      ```sh
      curl -sI "https://<old>.jevplay.games/some/path?x=1"
      # HTTP/2 301
      # location: https://<new>.jevplay.games/some/path?x=1
      ```

      If it does not return 301 to the new host, put the old custom domain back (the placeholder record must be
      deleted first, because the custom domain needs the hostname free) and investigate before trying again.

   **Chosen: placeholder record, after the old custom domain has outlived `legacySlug`.** Why: while the custom
   domain exists, the old host serves the game, not a redirect, so it must stay until nothing points at it (step 5).
   After that, the only way for the old host to 301 is to give it a DNS record that no Worker owns. A proxied
   `AAAA 100::` record does that without running anything. Not verified: whether a Redirect Rule would also fire in
   front of a live custom domain. The runbook does not rely on it.

## Hub assets that keep their old path

- `public/brand/og/guess-who.png` keeps being served next to `og/noul-who.png` (a byte copy of the Noul Who card,
  jev-guess-who `dist-hub/noul-who.png`) so cached social cards and the pre-rename Noul Who page's `og:image` do not 404. Drop it once
  `noul-who.jevplay.games` is live with `og:image` = `https://jevplay.games/brand/og/noul-who.png` and the old page
  has been redirecting for a while.

## Not verified

- That the `jevplay.games` zone is on Cloudflare (inferred from the wrangler custom-domain routes).
- The step-6 sequence on the live zone (custom domain removal, `AAAA 100::` placeholder, rule firing). It follows
  Cloudflare's documented redirect-only-hostname pattern but has not been run here.
- That the Cloudflare plan allows nine redirect rules (Bulk Redirects needs one list and one rule for all nine).
- That Discord accepts a new Interactions Endpoint URL on the same app without other changes.
