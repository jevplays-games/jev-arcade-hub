// The host runs `npm run build` before start. The hub has nothing to compile, so this
// validates the catalog and confirms every asset the page references is in the upload.
import { existsSync } from 'node:fs';
import { loadGames, buildCatalog } from '../lib/catalog.js';

const catalog = buildCatalog(loadGames());
const required = ['public/index.html', 'public/hub.css', 'public/hub.js', 'public/terms.html', 'public/privacy.html', 'public/brand/discord-icon-1024.png', 'public/brand/brand.css', 'public/brand/inter-var.woff2'];
const missing = required.filter((f) => !existsSync(new URL(`../${f}`, import.meta.url)));
if (missing.length) {
  console.error(`build failed, missing: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`build ok: ${catalog.length} games`);
for (const g of catalog) console.log(`  ${g.slug.padEnd(14)} ${g.url}`);
