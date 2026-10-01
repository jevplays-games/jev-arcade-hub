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
    if (!g.name || !g.tagline) throw new Error(`${g.slug}: name and tagline are required`);
    if (g.discordAppId !== undefined && !/^\d{17,20}$/.test(g.discordAppId)) throw new Error(`${g.slug}: invalid discordAppId`);
  }
  return games;
}

// GAME_URL_TIC_TAC_TOE=https://ttt.example.com overrides the default <slug>.<HUB_BASE_DOMAIN>.
export function envKey(slug) {
  return `GAME_URL_${slug.toUpperCase().replace(/-/g, '_')}`;
}

export function resolveUrl(slug, env = process.env) {
  const override = env[envKey(slug)];
  const raw = override || `${env.HUB_SCHEME || 'https'}://${slug}.${env.HUB_BASE_DOMAIN || 'jevplay.games'}`;
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`${slug}: unsupported protocol ${url.protocol}`);
  return url.origin;
}

export function buildCatalog(games, env = process.env) {
  return games.map((g) => ({ ...g, url: resolveUrl(g.slug, env) }));
}
