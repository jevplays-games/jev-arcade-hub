// The host runs `npm run build` before start. The hub has nothing to compile, so this
// validates the catalog and confirms every asset the page references is in the upload.
import { existsSync } from 'node:fs';
import { loadGames, buildCatalog, resolveUrl } from '../lib/catalog.js';

const catalog = buildCatalog(loadGames());
const required = [
  'public/index.html', 'public/hub.css', 'public/hub.js', 'public/terms.html', 'public/privacy.html',
  'public/brand/icon-1024.png', 'public/brand/og.png', 'public/brand/hero.png',
  'public/brand/icon.svg', 'public/brand/favicon-32.png', 'public/brand/apple-touch-icon.png', 'public/brand/brand.css', 'public/brand/inter-var.woff2', 'public/brand/OFL.txt',
  'public/brand/vt323.woff2', 'public/brand/OFL-VT323.txt',
  // Noul Who's og:image is served from here; the old path stays so cached social cards do not 404.
  'public/brand/og/noul-who.png', 'public/brand/og/guess-who.png',
  ...catalog.filter((g) => g.art).map((g) => `public${g.art}`),
];
const missing = required.filter((f) => !existsSync(new URL(`../${f}`, import.meta.url)));
if (missing.length) {
  console.error(`build failed, missing: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`build ok: ${catalog.length} games`);
for (const g of catalog) {
  const pending = g.legacySlug && new URL(g.url).hostname.startsWith(`${g.legacySlug}.`);
  // Pre-cutover rows show the host the card uses today and the new-slug URL it moves to.
  console.log(`  ${g.slug.padEnd(14)} ${g.url}${pending ? `  (legacy host; ${resolveUrl(g.slug)} at cutover)` : ''}`);
}
