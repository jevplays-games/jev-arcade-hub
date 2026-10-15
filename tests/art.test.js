import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import brand from '../art/brand.cjs';
import verifier from '../art/verify-game-art.cjs';
import renderer from '../art/render-art.cjs';

const root = fileURLToPath(new URL('../art/', import.meta.url));
const games = JSON.parse(fs.readFileSync(new URL('../games.json', import.meta.url), 'utf8'));
const slugs = [...games.map(g => g.slug), 'hub'];

test('art metadata follows the catalog', () => {
  assert.deepEqual(brand.GAMES, games.map(({ slug, name, tagline }) => ({ slug, name, tagline })));
  assert.deepEqual(brand.ORDER, slugs);
});

for (const slug of slugs) {
  test(`${slug} emblem exists`, () => {
    assert.ok(fs.existsSync(path.join(root, 'emblems', `${slug}.svg`)));
  });
}

for (const { slug } of games) {
  test(`${slug} approved source icon exists`, () => {
    assert.ok(fs.existsSync(path.join(root, 'src', 'game-icons', `${slug}.svg`)));
  });
}

test('approved game art matches pinned hashes', () => {
  assert.deepEqual(verifier.verifyGameArt(), []);
});

test('Jev robot matches the approved source', () => {
  const file = path.join(root, 'src', 'jev-robot.svg');
  assert.ok(fs.existsSync(file));
  assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    '644e0e7d9d91d06579f709b1f755ef48e7b2cf502426d0d41ee1e7131016448b');
});

test('art contains no retired brand names', () => {
  const banned = ['jevplays.games', 'JevPlay Arcade', 'JEV Arcade', 'JEVPLAY ARCADE'];
  function check(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) check(file);
      else {
        const bytes = fs.readFileSync(file);
        if (file.startsWith(path.join(root, 'out') + path.sep) && bytes.includes(0)) continue;
        for (const name of banned) assert.ok(!bytes.includes(name), `${file} contains ${name}`);
      }
    }
  }
  check(root);
});

test('cover and background templates still accept catalog metadata', () => {
  for (const game of [...brand.GAMES, brand.BRAND]) {
    for (const render of [renderer.cover, renderer.background]) {
      const html = render(game);
      assert.ok(!html.includes('undefined'), game.slug);
    }
    assert.ok(renderer.cover(game).includes(game.name));
    assert.ok(renderer.cover(game).includes(game.tagline));
  }
});
