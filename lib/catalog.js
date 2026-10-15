import { readFileSync } from 'node:fs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function loadGames(file = new URL('../games.json', import.meta.url)) {
  const games = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(games) || games.length === 0) throw new Error('games.json must be a non-empty array');
  const seen = new Set();
  for (const g of games) {
    if (!SLUG.test(g.slug ?? '')) throw new Error(`invalid slug: ${JSON.stringify(g.slug)}`);
    if (seen.has(g.slug)) throw new Error(`duplicate slug: ${g.slug}`);
    seen.add(g.slug);
    if (g.legacySlug !== undefined) {
      if (!SLUG.test(g.legacySlug) || g.legacySlug === g.slug) throw new Error(`${g.slug}: invalid legacySlug ${JSON.stringify(g.legacySlug)}`);
      if (seen.has(g.legacySlug)) throw new Error(`duplicate slug: ${g.legacySlug}`);
      seen.add(g.legacySlug);
    }
    if (!g.name || !g.tagline) throw new Error(`${g.slug}: name and tagline are required`);
    if (g.art !== undefined && !/^\/brand\/games\/[a-z0-9-]+\.png$/.test(g.art)) throw new Error(`${g.slug}: art must be /brand/games/<name>.png`);
    if (g.accent !== undefined && !/^#[0-9a-f]{6}$/i.test(g.accent)) throw new Error(`${g.slug}: accent must be a #rrggbb colour`);
    if (g.discordAppId !== undefined && !/^\d{17,20}$/.test(g.discordAppId)) throw new Error(`${g.slug}: invalid discordAppId`);
  }
  return games;
}

// GAME_URL_NOUL_WHO=https://nw.example.com overrides the default host for the game with slug noul-who.
export function envKey(slug) {
  return `GAME_URL_${slug.toUpperCase().replace(/-/g, '_')}`;
}

// Where a card points. First usable match wins:
//   1. GAME_URL_<SLUG>            the override for the current slug (GAME_URL_NOUL_WHO)
//   2. GAME_URL_<LEGACY_SLUG>     an override set before the rename (GAME_URL_GUESS_WHO) keeps working
//   3. <legacySlug>.<base>        while the row still has legacySlug: the game's new subdomain is not live yet,
//                                 so the card goes to the host that is answering today
//   4. <slug>.<base>
// A malformed or non-http(s) override is skipped with a warning, so one bad env var cannot stop the hub starting.
// Cutover for one game: once https://<slug>.jevplay.games answers, delete legacySlug from its games.json row
// (or set GAME_URL_<SLUG> to the new host to flip it without a release). See deploy/REDIRECTS.md.
export function resolveUrl(game, env = process.env, warn = console.warn) {
  const { slug, legacySlug } = typeof game === 'string' ? { slug: game } : game;
  for (const key of [envKey(slug), legacySlug && envKey(legacySlug)]) {
    const raw = key && env[key];
    if (!raw) continue;
    const origin = httpOrigin(raw);
    if (origin) return origin;
    warn(`${key}: ignoring ${JSON.stringify(raw)}, not an http(s) URL; using the next fallback for ${slug}`);
  }
  const fallback = httpOrigin(`${env.HUB_SCHEME || 'https'}://${legacySlug || slug}.${env.HUB_BASE_DOMAIN || 'jevplay.games'}`);
  if (!fallback) throw new Error(`${slug}: HUB_SCHEME and HUB_BASE_DOMAIN do not form an http(s) URL`);
  return fallback;
}

function httpOrigin(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

export function buildCatalog(games, env = process.env, warn = console.warn) {
  return games.map((g) => ({ ...g, url: resolveUrl(g, env, warn) }));
}
