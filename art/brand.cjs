const fs = require('node:fs');
const path = require('node:path');

const BRAND = { slug: 'hub', name: 'jevplay.games', tag: 'JEVPLAY.GAMES', url: 'jevplay.games', tagline: 'Nine games. Pick one. Play Jev.' };
const GAMES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'games.json'), 'utf8'))
  .map(({ slug, name, tagline }) => ({ slug, name, tagline }));
const ORDER = [...GAMES.map(g => g.slug), BRAND.slug];

module.exports = { BRAND, GAMES, ORDER };
