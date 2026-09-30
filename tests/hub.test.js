import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { loadGames, resolveUrl, envKey } from '../lib/catalog.js';
import { createHub } from '../server.js';

async function withHub(opts, fn) {
  const { handler } = createHub(opts);
  const server = createServer((req, res) => handler(req, res));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

test('catalog lists nine unique games', () => {
  const games = loadGames();
  assert.equal(games.length, 9);
  assert.equal(new Set(games.map((g) => g.slug)).size, 9);
});

test('urls default to <slug>.jevplay.games and honour overrides', () => {
  assert.equal(resolveUrl('checkers', {}), 'https://checkers.jevplay.games');
  assert.equal(resolveUrl('checkers', { HUB_BASE_DOMAIN: 'example.com' }), 'https://checkers.example.com');
  assert.equal(envKey('tic-tac-toe'), 'GAME_URL_TIC_TAC_TOE');
  assert.equal(resolveUrl('tic-tac-toe', { GAME_URL_TIC_TAC_TOE: 'http://localhost:8787/x' }), 'http://localhost:8787');
  assert.throws(() => resolveUrl('a', { GAME_URL_A: 'javascript:alert(1)' }));
});

test('serves the launcher, catalog and health check', async () => {
  await withHub({ env: {} }, async (base) => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /JEV Arcade/);
    assert.equal((await (await fetch(`${base}/api/games`)).json()).games.length, 9);
    assert.deepEqual(await (await fetch(`${base}/healthz`)).json(), { ok: true });
  });
});

test('serves terms and privacy at clean URLs', async () => {
  await withHub({ env: {} }, async (base) => {
    for (const p of ['/terms', '/privacy']) {
      const res = await fetch(`${base}${p}`);
      assert.equal(res.status, 200, p);
      assert.match(res.headers.get('content-type'), /text\/html/);
    }
  });
});

test('rejects traversal and non-GET methods', async () => {
  await withHub({ env: {} }, async (base) => {
    for (const p of ['/..%2fserver.js', '/%2e%2e/package.json', '/brand/../../package.json']) {
      const res = await fetch(`${base}${p}`);
      assert.ok([403, 404].includes(res.status), `${p} -> ${res.status}`);
      assert.doesNotMatch(await res.text(), /"name": "jev-arcade-hub"/);
    }
    assert.equal((await fetch(`${base}/api/games`, { method: 'POST' })).status, 405);
  });
});

test('status probes each game and treats 403 as reachable, 5xx and errors as down', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('checkers')) return new Response(null, { status: 403 });
    if (url.includes('sudoku')) return new Response(null, { status: 502 });
    if (url.includes('mastermind')) throw new Error('boom');
    return new Response(null, { status: 200 });
  };
  await withHub({ env: {}, fetchImpl }, async (base) => {
    const { games } = await (await fetch(`${base}/api/status`)).json();
    const by = Object.fromEntries(games.map((g) => [g.slug, g.up]));
    assert.equal(by.checkers, true);
    assert.equal(by.sudoku, false);
    assert.equal(by.mastermind, false);
    assert.equal(by['tic-tac-toe'], true);
  });
});
