// Verify pinned game cards and icons without rendering.
// usage: node art/verify-game-art.cjs
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { GAMES } = require('./brand.cjs');

function verifyGameArt(root = __dirname) {
  const sources = JSON.parse(fs.readFileSync(path.join(root, 'src', 'game-art-sources.json'), 'utf8'));
  const errors = [];
  for (const { slug } of GAMES) {
    for (const [kind, file] of [['og', `out/${slug}-og.png`], ['icon', `src/game-icons/${slug}.svg`]]) {
      try {
        const expected = sources.games[slug]?.[kind]?.sha256;
        const actual = createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
        if (actual !== expected) errors.push(`${file}: expected ${expected}, got ${actual}`);
      } catch (error) {
        errors.push(`${file}: ${error.message}`);
      }
    }
  }
  return errors;
}

module.exports = { verifyGameArt };
if (require.main === module) {
  try {
    const errors = verifyGameArt();
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else console.log('Verified all nine game cards and icons.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
