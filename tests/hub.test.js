import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadGames, resolveUrl, envKey, buildCatalog } from '../lib/catalog.js';
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

const RENAMES = {
  'tic-tac-typed': ['Tic-Tac-Typed', 'tic-tac-toe'],
  'choice-four': ['Choice Four', 'connect-four'],
  typecheckers: ['Typecheckers', 'checkers'],
  'box-score': ['Box Score', 'dots-and-boxes'],
  'noul-who': ['Noul Who', 'guess-who'],
  typecrack: ['Typecrack', 'mastermind'],
  safesweep: ['SafeSweep', 'minesweeper'],
  typedoku: ['Typedoku', 'sudoku'],
  'slide-score': ['Slide Score', '2048'],
};

test('catalog lists the nine renamed games', () => {
  const games = loadGames();
  assert.equal(games.length, 9);
  assert.deepEqual(games.map((g) => g.slug).sort(), Object.keys(RENAMES).sort());
  for (const g of games) {
    const [name, legacy] = RENAMES[g.slug];
    assert.equal(g.name, name);
    assert.equal(g.legacySlug, legacy);
    assert.equal(g.art, `/brand/games/${g.slug}.png`);
    assert.ok(existsSync(new URL(`../public${g.art}`, import.meta.url)), `${g.art} exists`);
    assert.doesNotMatch(g.tagline, /\bJEV\b/, 'Jev, not JEV, in prose');
  }
});

test('urls default to <slug>.jevplay.games and honour overrides', () => {
  assert.equal(resolveUrl('typecheckers', {}), 'https://typecheckers.jevplay.games');
  assert.equal(resolveUrl('typecheckers', { HUB_BASE_DOMAIN: 'example.com' }), 'https://typecheckers.example.com');
  assert.equal(envKey('tic-tac-typed'), 'GAME_URL_TIC_TAC_TYPED');
  assert.equal(resolveUrl('tic-tac-typed', { GAME_URL_TIC_TAC_TYPED: 'http://localhost:8787/x' }), 'http://localhost:8787');
});

test('a malformed GAME_URL_* override is skipped with a warning, not fatal', async () => {
  const warnings = [];
  const warn = (m) => warnings.push(m);
  const game = { slug: 'noul-who', legacySlug: 'guess-who' };
  // Bad new key: falls through to a good old key.
  assert.equal(resolveUrl(game, { GAME_URL_NOUL_WHO: 'javascript:alert(1)', GAME_URL_GUESS_WHO: 'http://localhost:9000' }, warn), 'http://localhost:9000');
  // Both bad: falls back to the legacy host.
  assert.equal(resolveUrl(game, { GAME_URL_NOUL_WHO: 'not a url', GAME_URL_GUESS_WHO: 'ftp://x.example' }, warn), 'https://guess-who.jevplay.games');
  assert.equal(resolveUrl('a', { GAME_URL_A: 'javascript:alert(1)' }, warn), 'https://a.jevplay.games');
  assert.equal(warnings.length, 4);
  assert.match(warnings[0], /^GAME_URL_NOUL_WHO: ignoring "javascript:alert\(1\)"/);
  // The hub still starts and serves every card.
  const original = console.warn;
  console.warn = warn;
  try {
    await withHub({ env: { GAME_URL_TYPECRACK: '::bad::' } }, async (base) => {
      const { games } = await (await fetch(`${base}/api/games`)).json();
      assert.equal(games.length, 9);
      assert.equal(games.find((g) => g.slug === 'typecrack').url, 'https://mastermind.jevplay.games');
    });
  } finally {
    console.warn = original;
  }
  assert.match(warnings.at(-1), /^GAME_URL_TYPECRACK: ignoring/);
});

test('before cutover a card points at the host the game answers on today', () => {
  const game = { slug: 'noul-who', legacySlug: 'guess-who' };
  // Default: the legacy host, so shipping the hub first never breaks a card.
  assert.equal(resolveUrl(game, {}), 'https://guess-who.jevplay.games');
  assert.equal(resolveUrl(game, { HUB_BASE_DOMAIN: 'example.com' }), 'https://guess-who.example.com');
  // An override under the old key (already set on the host) still applies.
  assert.equal(resolveUrl(game, { GAME_URL_GUESS_WHO: 'http://localhost:9000' }), 'http://localhost:9000');
  // The new key wins over the old one and flips the game to its new host without a release.
  assert.equal(resolveUrl(game, { GAME_URL_GUESS_WHO: 'http://localhost:9000', GAME_URL_NOUL_WHO: 'https://noul-who.jevplay.games' }), 'https://noul-who.jevplay.games');
  // Cutover: once legacySlug is removed from the row, the new subdomain is the default and old keys are ignored.
  assert.equal(resolveUrl({ slug: 'noul-who' }, { GAME_URL_GUESS_WHO: 'http://localhost:9000' }), 'https://noul-who.jevplay.games');
  // Every shipped row is still pre-cutover.
  for (const g of buildCatalog(loadGames(), {})) assert.equal(g.url, `https://${g.legacySlug}.jevplay.games`);
});

test('rejects a legacySlug that collides with another slug', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hub-'));
  const file = path.join(dir, 'games.json');
  writeFileSync(file, JSON.stringify([{ slug: 'a', legacySlug: 'b', name: 'A', tagline: 't' }, { slug: 'b', name: 'B', tagline: 't' }]));
  assert.throws(() => loadGames(file), /duplicate slug: b/);
  writeFileSync(file, JSON.stringify([{ slug: 'a', legacySlug: 'a', name: 'A', tagline: 't' }]));
  assert.throws(() => loadGames(file), /invalid legacySlug/);
});

test('serves the launcher, catalog and health check', async () => {
  await withHub({ env: {} }, async (base) => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /<h1>jevplay\.games<\/h1>/);
    assert.match(html, /<title>jevplay\.games<\/title>/);
    assert.doesNotMatch(html, /JevPlay Arcade|JEV Arcade|\bJEV\b/);
    const listed = (await (await fetch(`${base}/api/games`)).json()).games;
    assert.equal(listed.length, 9);
    assert.deepEqual(Object.fromEntries(listed.map((g) => [g.slug, g.name])), Object.fromEntries(Object.entries(RENAMES).map(([s, [n]]) => [s, n])));
    assert.ok(listed.every((g) => /^\d{17,20}$/.test(g.discordAppId)), 'every game carries its Discord app id');
    assert.ok(listed.every((g) => g.art), 'every game carries card art');
    const art = await fetch(`${base}${listed[0].art}`);
    assert.equal(art.status, 200);
    assert.equal(art.headers.get('content-type'), 'image/png');
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
      assert.doesNotMatch(await res.text(), /"name": "jevplay-games"/);
    }
    assert.equal((await fetch(`${base}/api/games`, { method: 'POST' })).status, 405);
  });
});

test('status probes each game and treats 403 as reachable, 5xx and errors as down', async () => {
  const fetchImpl = async (url) => {
    const { hostname } = new URL(url);
    if (hostname === 'typecheckers.jevplay.games') return new Response(null, { status: 403 });
    if (hostname === 'typedoku.jevplay.games') return new Response(null, { status: 502 });
    if (hostname === 'typecrack.jevplay.games') throw new Error('boom');
    return new Response(null, { status: 200 });
  };
  // Point three games at their new hosts, as GAME_URL_<SLUG> does at cutover; the rest probe their legacy hosts.
  const env = { GAME_URL_TYPECHECKERS: 'https://typecheckers.jevplay.games', GAME_URL_TYPEDOKU: 'https://typedoku.jevplay.games', GAME_URL_TYPECRACK: 'https://typecrack.jevplay.games' };
  await withHub({ env, fetchImpl }, async (base) => {
    const { games } = await (await fetch(`${base}/api/status`)).json();
    const by = Object.fromEntries(games.map((g) => [g.slug, g.up]));
    assert.equal(by.typecheckers, true);
    assert.equal(by.typedoku, false);
    assert.equal(by.typecrack, false);
    assert.equal(by['tic-tac-typed'], true);
  });
});

test('is frameable by Discord only when opened as an Activity, and exposes its client id', async () => {
  await withHub({ env: {} }, async (base) => {
    const plain = await fetch(base + '/');
    assert.ok(plain.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    const activity = await fetch(base + '/?frame_id=abc&instance_id=1');
    const csp = activity.headers.get('content-security-policy');
    assert.ok(csp.includes('frame-ancestors https://discord.com https://ptb.discord.com https://canary.discord.com'));
    assert.ok(!csp.includes("frame-ancestors 'none'"));
    // non-document responses stay unframeable even with frame_id
    const css = await fetch(base + '/hub.css?frame_id=abc');
    assert.ok(css.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    const config = await (await fetch(base + '/api/activity/config')).json();
    assert.equal(config.clientId, '1554746719227613214');
  });
});

test('serves the Noul Who social card at its new path and keeps the old one', async () => {
  await withHub({ env: {} }, async (base) => {
    for (const p of ['/brand/og/noul-who.png', '/brand/og/guess-who.png']) {
      const res = await fetch(`${base}${p}`);
      assert.equal(res.status, 200, p);
      assert.equal(res.headers.get('content-type'), 'image/png');
    }
  });
});

test('brand.css is self-contained: pink/ink palette and self-hosted fonts with their licences', async () => {
  const css = readFileSync(new URL('../public/brand/brand.css', import.meta.url), 'utf8');
  for (const hex of ['#F386A1', '#1E1E1E', '#E551BA', '#DEDEDE', '#FEFEFE']) assert.ok(css.includes(hex), hex);
  assert.doesNotMatch(css, /JEV Arcade|JEV ARCADE|color-scheme:dark/);
  // D8 chart tokens, and the semantic tokens that must hold 3:1 as marks on grey/paper panels.
  assert.match(css, /--chart-jev:#7A4E0B; --chart-human:#155A80;/);
  // D14: --jev/--warn stay amber (games put ink on them); only the Jev panel strip uses the dark chart amber.
  assert.match(css, /--human:var\(--blue\); --jev:var\(--amber\);/);
  assert.match(css, /--warn:var\(--amber\); --danger:#A8237F;/);
  assert.match(css, /\.jv-panel\.is-jev\{border-top:4px solid var\(--chart-jev\)\}/);
  // Every url() is a same-origin /brand/ font: no remote fonts (CSP default-src 'self') and no data: URIs.
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]);
  assert.deepEqual(urls.sort(), ['/brand/inter-var.woff2', '/brand/vt323.woff2']);
  await withHub({ env: {} }, async (base) => {
    for (const [p, type] of [['/brand/vt323.woff2', 'font/woff2'], ['/brand/inter-var.woff2', 'font/woff2'], ['/brand/OFL-VT323.txt', 'text/plain; charset=utf-8'], ['/brand/OFL.txt', 'text/plain; charset=utf-8']]) {
      const res = await fetch(`${base}${p}`);
      assert.equal(res.status, 200, p);
      assert.equal(res.headers.get('content-type'), type, p);
    }
    assert.match(await (await fetch(`${base}/brand/OFL-VT323.txt`)).text(), /VT323 Project Authors[\s\S]*SIL Open Font License, Version 1\.1/);
  });
});

test('serves hub social art and descriptive Open Graph metadata', async () => {
  await withHub({ env: {} }, async (base) => {
    for (const asset of ['/brand/og.png', '/brand/icon-1024.png']) {
      const response = await fetch(`${base}${asset}`);
      assert.equal(response.status, 200, asset);
      assert.equal(response.headers.get('content-type'), 'image/png', asset);
    }
    const html = await (await fetch(base)).text();
    assert.match(html, /<meta property="og:image" content="https:\/\/jevplay\.games\/brand\/og\.png">/);
    const alt = html.match(/<meta property="og:image:alt" content="([^"]*)">/)?.[1];
    assert.ok(alt?.trim(), 'og:image:alt is non-empty');
    assert.doesNotMatch(alt, /emblems beside the Jev mark/i);
  });
});

test('shared header files: sheet takes focus, header never hides or clips focus, brand link goes to the hub', async () => {
  const css = readFileSync(new URL('../public/brand/brand.css', import.meta.url), 'utf8');
  // The open sheet is visible at once, or focus() into it is rejected while visibility is still transitioning.
  assert.match(css, /\.jv-sheet\.is-open\{[^}]*visibility:visible;transition:transform \.18s steps\(4,end\),visibility 0s\}/);
  // A control scrolled into view by focus clears the sticky header.
  assert.match(css, /html\{[^}]*scroll-padding-top:calc\(var\(--header-h\) \+ var\(--sa-t\) \+ var\(--s4\)\)/);
  // The scrolling header strip leaves room for the focus ring without growing the header.
  assert.match(css, /#jv-controls\{[^}]*overflow-x:auto;[^}]*padding:calc\(var\(--focus-w\) \+ var\(--focus-offset\)\);margin-block:calc\(-1 \* \(var\(--focus-w\) \+ var\(--focus-offset\)\)\)\}/);
  const js = readFileSync(new URL('../public/brand/brand.js', import.meta.url), 'utf8');
  assert.match(js, /export const HUB_URL = 'https:\/\/jevplay\.games\/';/);
  assert.match(js, /window\.top === window\.self\) brand\.setAttribute\('href', HUB_URL\)/, 'outside a Discord frame only');
  assert.match(js, /else \{ sheet\.setAttribute\('tabindex', '-1'\); sheet\.focus\(\); \}/, 'an empty sheet still takes focus');
});

test('header status chip wraps below 600px instead of clipping mid-letter', () => {
  const css = readFileSync(new URL('../public/brand/brand.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(max-width:599\.98px\)\{\n  \.jv-status\{white-space:normal;line-height:1\.05;padding-block:4px;max-width:none;min-width:min-content\}\n\}/);
  assert.match(css, /@media\(max-width:359\.98px\)\{\.jv-status\{font-size:var\(--fs-sm\);letter-spacing:0\}\}/);
  // The base rule and the >=600px rule are unchanged (pixel-identical header at 600/900/1440).
  assert.match(css, /flex:0 1 auto;min-width:0;max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;/);
});

test('landing keyboard focus: a tag chip scrolls clear of the arrow tab, a card keeps its whole focus ring', () => {
  const css = readFileSync(new URL('../public/hub.css', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../public/hub.js', import.meta.url), 'utf8');
  // The phone strip's end scroll padding is the gutter plus the 28px arrow tab.
  assert.match(css, /\.hub-tags\{[^}]*scroll-padding-inline:var\(--gutter\) calc\(var\(--gutter\) \+ 28px\)/);
  assert.match(css, /\.hub-tags::after\{[^}]*width:28px/);
  // Browsers leave a half-visible chip in place on focus; hub.js finishes the scroll (honouring that padding).
  assert.match(js, /tagsEl\.addEventListener\('focusin', \(event\) => event\.target\.scrollIntoView\(\{ block: 'nearest', inline: 'nearest' \}\)\)/);
  assert.match(css, /html\{scroll-padding-bottom:var\(--s3\)\}/);
  // With no tags (the game list failed to load) the strip shows no orphan arrow tab.
  assert.match(css, /\.hub-tags:empty::after\{content:none\}/);
});

test('landing cards never push the PLAY pill past their edge (short landscape frames)', () => {
  const css = readFileSync(new URL('../public/hub.css', import.meta.url), 'utf8');
  // A card under ~285px cannot hold status and PLAY side by side: short frames take as many 18rem columns as fit
  // (three forced columns overflowed the page at 640x360 to 800x450), and the footer wraps instead of overflowing.
  assert.match(css, /@media \(max-height:500px\) and \(min-width:600px\)\{\.hub-grid\{grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,18rem\),1fr\)\)\}\}/);
  assert.doesNotMatch(css, /max-height:500px\) and \(min-width:600px\)\{\.hub-grid\{grid-template-columns:repeat\(3/);
  assert.match(css, /\.hub-foot-row\{display:flex;flex-wrap:wrap;/);
  assert.match(css, /\.hub-card \.play\{margin-left:auto;/);
});
