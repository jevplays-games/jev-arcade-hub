import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import brand from '../art/brand.cjs';
import verifier from '../art/verify-game-art.cjs';
import renderer from '../art/render-art.cjs';
import syncer from '../art/sync-emblems.cjs';

const root = fileURLToPath(new URL('../art/', import.meta.url));
const games = JSON.parse(fs.readFileSync(new URL('../games.json', import.meta.url), 'utf8'));
const slugs = [...games.map(g => g.slug), 'hub'];
const palette = new Set(['#F386A1', '#1E1E1E', '#E551BA', '#DEDEDE', '#FEFEFE', '#1F78A8', '#E8A33D']);

test('emblem directory contains exactly the catalog and hub SVGs', () => {
  assert.deepEqual(fs.readdirSync(path.join(root, 'emblems')).sort(), slugs.map(slug => `${slug}.svg`).sort());
});

test('art metadata follows the catalog', () => {
  assert.deepEqual(brand.GAMES, games.map(({ slug, name, tagline }) => ({ slug, name, tagline })));
  assert.deepEqual(brand.ORDER, slugs);
});

for (const slug of slugs) {
  test(`${slug} emblem follows the portable SVG contract`, () => {
    const svg = fs.readFileSync(path.join(root, 'emblems', `${slug}.svg`), 'utf8');
    const name = slug === 'hub' ? 'jevplay.games' : games.find(game => game.slug === slug).name;
    const opening = svg.match(/^<svg\b[^>]*>/)?.[0];
    assert.ok(opening);
    assert.match(opening, /\bviewBox="0 0 512 512"/);
    assert.match(opening, /\bwidth="512"/);
    assert.match(opening, /\bheight="512"/);
    assert.equal(svg.match(/<title>([^<]*)<\/title>/)?.[1], name);
    assert.ok(opening.includes(`aria-label="${name}"`));
    assert.doesNotMatch(svg, /<\s*(?:style|filter|text|image)\b|\s(?:style|class|filter)\s*=|data:/i);
    for (const hex of svg.match(/#[0-9a-f]+\b/gi) ?? []) {
      assert.ok(palette.has(hex), `${slug} uses non-palette color ${hex}`);
    }
    assert.ok(Buffer.byteLength(svg) < 12 * 1024);
  });
}

test('sync-emblems reports every emblem in step with its game icon', () => {
  for (const { slug } of games) {
    const emblem = fs.readFileSync(path.join(root, 'emblems', `${slug}.svg`), 'utf8');
    const icon = fs.readFileSync(path.join(root, 'src', 'game-icons', `${slug}.svg`), 'utf8');
    assert.equal(syncer.syncEmblem(emblem, icon), emblem, slug);
  }
});

for (const { slug } of games) {
  test(`${slug} emblem preserves the approved drawing verbatim`, () => {
    const source = fs.readFileSync(path.join(root, 'src', 'game-icons', `${slug}.svg`), 'utf8');
    const shapes = source.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)[1]
      .replace(/<!--[\s\S]*?-->|<title\b[^>]*>[\s\S]*?<\/title>/g, '')
      .replace(/[ \t]+$/gm, '');
    const emblem = fs.readFileSync(path.join(root, 'emblems', `${slug}.svg`), 'utf8');
    assert.ok(emblem.includes(`<svg x="106" y="106" width="300" height="300" viewBox="0 0 64 64" shape-rendering="crispEdges">${shapes}</svg>`));
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

test('every art/out file belongs to a catalog slug or the hub', () => {
  const kinds = ['icon-1024.png', 'cover.png', 'background.png', 'og.png', 'preview.mp4'];
  const expected = [...slugs.flatMap(slug => kinds.map(kind => `${slug}-${kind}`)), 'icons-sheet.png'].sort();
  assert.deepEqual(fs.readdirSync(path.join(root, 'out')).filter(name => !name.startsWith('.')).sort(), expected);
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
    assert.ok(renderer.cover(game).replace(/<[^>]*>/g, '').includes(game.tagline));
  }
});

for (const template of ['banner.html', 'social.html']) {
  test(`${template} uses current hub names and the canonical Jev source`, () => {
    const html = fs.readFileSync(new URL(`../assets/src/${template}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /jevplays|arcade/i);
    // Word boundaries allow the current catalog name Typecheckers.
    assert.doesNotMatch(html, /\b(?:Guess[ -]Who|Connect[ -]Four|Mastermind|Minesweeper|Sudoku|Tic-Tac-Toe|Checkers|Dots(?: and |-)Boxes|2048)\b/i);
    assert.match(html, /src="\.\.\/\.\.\/art\/src\/jev-robot\.svg"/);
    for (const { slug, name } of games) {
      assert.ok(html.includes(`+${slug}`), `${slug} chip missing`);
      assert.ok(html.includes(`>${name}</span>`), `${name} launcher row missing`);
      assert.ok(html.includes(`../../art/src/game-icons/${slug}.svg`));
    }
  });
}
