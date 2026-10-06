// Renders the illustrated emblems in art/emblems/<slug>.svg to rasters:
//   out/<slug>-icon-1024.png   Discord application icon (Developer Portal > General Information > App Icon)
//   out/icons-sheet.png        all emblems at 256 / 80 / 40 px, square and circle-cropped, to check the family and the silhouettes
//   out/<slug>-og.png          1200x630 social card (og:image / twitter:image)
// With --install <gamesRoot> it also writes each repo's page-meta rasters into its public/brand/:
//   apple-touch-icon.png (180), favicon-32.png, og.png -- palette-quantised with ffmpeg (on PATH), because every
//   byte ships with the game and guess-who enforces an asset budget. The Discord icon stays truecolour.
// usage: node art/render-icons.cjs <playwright-dir> <chromium-exe> [--out dir] [--install gamesRoot] [slug...]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const { GAMES, ARCADE, font } = require('./render-art.cjs');

// slug -> repo directory under the games root (the git root is the inner directory).
const REPOS = {
  'tic-tac-toe': 'jev-tic-tac-toe/jev-tic-tac-toe',
  'connect-four': 'jev-connect-four/jev-connect-four',
  checkers: 'jev-checkers-analytics/jev-checkers-analytics',
  'dots-and-boxes': 'jev-dots-and-boxes/jev-dots-and-boxes',
  'guess-who': 'jev-guess-who/jev-guess-who',
  mastermind: 'jev-mastermind/jev-mastermind',
  minesweeper: 'jev-minesweeper/jev-minesweeper',
  sudoku: 'jev-sudoku-analytics/jev-sudoku',
  2048: 'jev-2048-arcade/jev-2048-arcade',
  arcade: 'jev-arcade-hub',
};
const ORDER = Object.keys(REPOS);
const META = [['apple-touch-icon.png', 180], ['favicon-32.png', 32]];
// guess-who enforces 150,000 gzip bytes over everything it serves (npm run check) and a PNG does not compress.
// Its social card is therefore served by the hub (public/brand/og/<slug>.png; only link scrapers fetch it, and
// og:image may be any absolute URL) and its touch icon uses a smaller palette. The budget itself is not touched.
const LEAN = new Set(['guess-who']);
const emblemDir = path.join(__dirname, 'emblems');
const emblem = slug => path.join(emblemDir, `${slug}.svg`);

function parse(argv) {
  const [pwDir, exe, ...rest] = argv;
  const opts = { pwDir, exe, out: path.join(__dirname, 'out'), install: null, slugs: [] };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--out') opts.out = rest[++i];
    else if (rest[i] === '--install') opts.install = rest[++i];
    else opts.slugs.push(rest[i]);
  }
  return opts;
}

const page1 = (file, size) => `<!doctype html><meta charset="utf-8"><style>*{margin:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:#0e1017}img{display:block;width:${size}px;height:${size}px}</style><img src="${pathToFileURL(file).href}">`;

// Social card: the emblem as a lit tile on the game's ground, title and tagline beside it.
function og(slug) {
  const g = [...GAMES, ARCADE].find(x => x.slug === slug);
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:Inter;src:url("${font}") format("woff2");font-weight:100 900}
    *{box-sizing:border-box;margin:0}
    body{width:1200px;height:630px;overflow:hidden;background:#0e1017;font-family:Inter,sans-serif;color:#eef0f7;position:relative}
    .glow{position:absolute;inset:0;background:radial-gradient(90% 120% at 0% 0%,${g.accent}3d,transparent 60%),radial-gradient(60% 90% at 100% 100%,#6fdcc81f,transparent 60%)}
    .brand{position:absolute;left:72px;top:64px;font-size:19px;font-weight:700;letter-spacing:.16em;color:#a3aabd}
    h1{position:absolute;left:72px;top:${g.title.length > 11 ? 196 : 180}px;width:600px;font-size:${g.title.length > 11 ? 92 : 112}px;line-height:.98;font-weight:800;letter-spacing:-.04em}
    p{position:absolute;left:72px;top:416px;width:560px;font-size:31px;line-height:1.3;font-weight:600;color:${g.accent}}
    .url{position:absolute;left:72px;bottom:60px;font-size:20px;letter-spacing:.06em;color:#78809a}
    img{position:absolute;right:72px;top:95px;width:440px;height:440px;border-radius:96px;box-shadow:0 2px 0 #ffffff2e inset,0 30px 70px #000000a0,0 0 90px -20px ${g.accent}90}
  </style><div class="glow"></div><div class="brand">${g.brand || 'JEVPLAY ARCADE'}</div><h1>${g.title}</h1><p>${g.tag}</p><div class="url">${g.url || g.slug + '.jevplay.games'}</div><img src="${pathToFileURL(emblem(slug)).href}">`;
}

function sheet(slugs) {
  const cell = s => {
    const src = pathToFileURL(emblem(s)).href;
    return `<div class="c"><img class="a" src="${src}"><div class="r"><img class="b" src="${src}"><img class="d" src="${src}"><img class="e" src="${src}"></div><span>${s}</span></div>`;
  };
  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}body{width:1500px;background:#313338;font:600 14px system-ui,sans-serif;color:#dbdee1;padding:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:30px 20px}
    .c{display:flex;flex-direction:column;align-items:center;gap:12px}.r{display:flex;align-items:center;gap:14px}
    .a{width:256px;height:256px;border-radius:56px}.b{width:80px;height:80px;border-radius:50%}.d{width:40px;height:40px;border-radius:50%}.e{width:40px;height:40px;border-radius:10px}
  </style>${slugs.map(cell).join('')}`;
}

async function main() {
  const opts = parse(process.argv.slice(2));
  if (!opts.pwDir || !opts.exe) throw new Error('usage: node art/render-icons.cjs <playwright-dir> <chromium-exe> [--out dir] [--install gamesRoot] [slug...]');
  const moduleDir = fs.existsSync(path.join(opts.pwDir, 'node_modules', 'playwright-core')) ? path.join(opts.pwDir, 'node_modules', 'playwright-core') : opts.pwDir;
  const { chromium } = require(path.resolve(moduleDir));
  const outDir = path.resolve(opts.out);
  fs.mkdirSync(outDir, { recursive: true });
  const have = ORDER.filter(s => fs.existsSync(emblem(s)));
  const slugs = opts.slugs.length ? opts.slugs : have;
  const browser = await chromium.launch({ executablePath: opts.exe });
  const tmp = path.join(outDir, '.icon.html');
  const shot = async (html, width, height, file) => {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    try {
      fs.writeFileSync(tmp, html);
      await page.goto(pathToFileURL(tmp).href);
      await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode())]));
      await page.screenshot({ path: file, fullPage: true });
    } finally { await page.close(); }
  };
  try {
    for (const slug of slugs) {
      if (!fs.existsSync(emblem(slug))) { console.error('missing emblem', slug); process.exitCode = 1; continue; }
      await shot(page1(emblem(slug), 1024), 1024, 1024, path.join(outDir, `${slug}-icon-1024.png`));
      await shot(og(slug), 1200, 630, path.join(outDir, `${slug}-og.png`));
      if (opts.install) {
        const brand = path.join(path.resolve(opts.install), REPOS[slug], 'public', 'brand');
        const raw = path.join(outDir, '.meta.png');
        const lean = LEAN.has(slug);
        const quantise = (file, colors = 256) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-vf', `split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=single[p];[b][p]paletteuse=dither=${colors < 256 ? 'none' : 'sierra2_4a'}`, '-frames:v', '1', '-update', '1', file]);
        for (const [name, size] of META) { await shot(page1(emblem(slug), size), size, size, raw); quantise(path.join(brand, name), lean ? 40 : 256); }
        const ogDir = lean ? path.join(path.resolve(opts.install), REPOS.arcade, 'public', 'brand', 'og') : brand;
        fs.mkdirSync(ogDir, { recursive: true });
        // The hub's own card is arcade-og.png from render-landing.cjs, so it takes no og.png from here.
        if (slug !== 'arcade') { fs.copyFileSync(path.join(outDir, `${slug}-og.png`), raw); quantise(path.join(ogDir, lean ? `${slug}.png` : 'og.png')); }
        if (lean) fs.rmSync(path.join(brand, 'og.png'), { force: true });
        // The hub's card art for this game.
        if (slug !== 'arcade') {
          const cards = path.join(path.resolve(opts.install), REPOS.arcade, 'public', 'brand', 'games');
          fs.mkdirSync(cards, { recursive: true });
          await shot(page1(emblem(slug), 320), 320, 320, raw); quantise(path.join(cards, `${slug}.png`));
        }
        fs.unlinkSync(raw);
      }
      console.log('rendered', slug, opts.install ? '+ page meta' : '');
    }
    await shot(sheet(have), 1500, 800, path.join(outDir, 'icons-sheet.png'));
    console.log('rendered icons-sheet', have.length, 'emblems');
  } finally {
    await browser.close();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
