import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGames, buildCatalog } from './lib/catalog.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

const HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

const PROBE_TTL_MS = 60_000;
const PROBE_TIMEOUT_MS = 3_000;

export function createHub({ env = process.env, games = loadGames(), fetchImpl = fetch } = {}) {
  const catalog = buildCatalog(games, env);
  let probeCache = { at: 0, value: null };

  // Reachability only: any HTTP response under 500 means the game's own origin is answering.
  // Games reject foreign Hosts with 403, which still counts as up.
  async function probe(game) {
    const started = Date.now();
    try {
      const res = await fetchImpl(game.url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
      await res.body?.cancel();
      return { slug: game.slug, up: res.status < 500, ms: Date.now() - started };
    } catch {
      return { slug: game.slug, up: false, ms: Date.now() - started };
    }
  }

  async function status() {
    if (probeCache.value && Date.now() - probeCache.at < PROBE_TTL_MS) return probeCache.value;
    const results = await Promise.all(catalog.map(probe));
    probeCache = { at: Date.now(), value: { checkedAt: new Date().toISOString(), games: results } };
    return probeCache.value;
  }

  const json = (res, code, body, extra = {}) => {
    res.writeHead(code, { 'content-type': TYPES['.json'], 'cache-control': 'no-store', ...HEADERS, ...extra });
    res.end(JSON.stringify(body));
  };

  async function serveStatic(req, res, pathname) {
    let rel;
    try {
      rel = decodeURIComponent(pathname);
    } catch {
      return json(res, 400, { error: 'bad_request' });
    }
    if (rel.includes('\0')) return json(res, 400, { error: 'bad_request' });
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(PUBLIC, `.${rel}`);
    // Compare against path.sep: path.resolve emits backslashes on Windows.
    if (file !== PUBLIC && !file.startsWith(PUBLIC + path.sep)) return json(res, 403, { error: 'forbidden' });
    try {
      let target = file;
      // Clean URLs: /terms serves terms.html.
      if (!path.extname(target)) target += '.html';
      const info = await stat(target);
      if (!info.isFile()) throw new Error('not a file');
      const body = await readFile(target);
      const ext = path.extname(target);
      res.writeHead(200, {
        'content-type': TYPES[ext] || 'application/octet-stream',
        'content-length': body.length,
        'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        ...HEADERS,
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      json(res, 404, { error: 'not_found' });
    }
  }

  const handler = async (req, res) => {
    const { pathname } = new URL(req.url, 'http://hub.local');
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method_not_allowed' }, { allow: 'GET, HEAD' });
    if (pathname === '/healthz') return json(res, 200, { ok: true });
    if (pathname === '/api/games') return json(res, 200, { games: catalog });
    if (pathname === '/api/status') return json(res, 200, await status());
    return serveStatic(req, res, pathname);
  };

  return { handler, catalog };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const { handler } = createHub();
  createServer((req, res) => {
    handler(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) res.writeHead(500, { 'content-type': TYPES['.json'] });
      res.end(JSON.stringify({ error: 'internal_error' }));
    });
  }).listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
}
