// Re-embed each game's approved drawing (art/src/game-icons/<slug>.svg) in its emblem, verbatim.
// Run after copying a game's new icon in (art/README.md "Sources"), then re-render.
// usage: node art/sync-emblems.cjs [--check]
const fs = require('node:fs');
const path = require('node:path');
const { GAMES } = require('./brand.cjs');

const OPEN = '<svg x="106" y="106" width="300" height="300" viewBox="0 0 64 64" shape-rendering="crispEdges">';

// The drawing as tests/art.test.js expects it: the icon's children without its <title> or comments.
function shapes(icon) {
  return icon.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)[1]
    .replace(/<!--[\s\S]*?-->|<title\b[^>]*>[\s\S]*?<\/title>/g, '')
    .replace(/[ \t]+$/gm, '');
}

function syncEmblem(emblem, icon) {
  const start = emblem.indexOf(OPEN);
  const end = emblem.lastIndexOf('</svg>', emblem.lastIndexOf('</svg>') - 1);
  if (start < 0 || end < start) throw new Error('emblem has no embedded game drawing');
  return `${emblem.slice(0, start)}${OPEN}${shapes(icon)}${emblem.slice(end)}`;
}

function main(check = process.argv.includes('--check')) {
  const stale = [];
  for (const { slug } of GAMES) {
    const file = path.join(__dirname, 'emblems', `${slug}.svg`);
    const before = fs.readFileSync(file, 'utf8');
    const after = syncEmblem(before, fs.readFileSync(path.join(__dirname, 'src', 'game-icons', `${slug}.svg`), 'utf8'));
    if (after === before) continue;
    stale.push(slug);
    if (!check) fs.writeFileSync(file, after);
  }
  if (check && stale.length) {
    console.error(`emblems out of date: ${stale.join(', ')} (run node art/sync-emblems.cjs)`);
    process.exitCode = 1;
  } else console.log(stale.length ? `updated: ${stale.join(', ')}` : 'all emblems match their game icons');
}

module.exports = { shapes, syncEmblem };
if (require.main === module) main();
