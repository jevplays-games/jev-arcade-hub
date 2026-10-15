// Renders Discord icons and a contact sheet; approved game OG cards are never written here.
// usage: node art/render-icons.cjs <playwright-dir> <chromium-exe> [--out dir] [slug...]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { BRAND, GAMES, ORDER } = require('./brand.cjs');

const { font, pixelFont } = require('./render-art.cjs');
const emblemDir = path.join(__dirname, 'emblems');
const emblem = slug => path.join(emblemDir, `${slug}.svg`);

function parse(argv) {
  const [pwDir, exe, ...rest] = argv;
  const opts = { pwDir, exe, out: path.join(__dirname, 'out'), slugs: [] };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--out') opts.out = rest[++i];
    else if (!ORDER.includes(rest[i])) throw new Error(`unknown slug or option: ${rest[i]}`);
    else opts.slugs.push(rest[i]);
  }
  return opts;
}

const page1 = (file, size) => `<!doctype html><meta charset="utf-8"><style>*{margin:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}img{display:block;width:${size}px;height:${size}px}</style><img src="${pathToFileURL(file).href}">`;

function sheet(slugs = ORDER) {
  const cell = slug => {
    const src = pathToFileURL(emblem(slug)).href;
    const name = [...GAMES, BRAND].find(g => g.slug === slug).name;
    return `<section class="cell"><div class="name">${name}</div><img class="large" src="${src}" alt=""><div class="samples"><img width="80" height="80" src="${src}" alt=""><img width="40" height="40" src="${src}" alt=""><span class="ring"><img class="circle" width="80" height="80" src="${src}" alt=""></span><span class="ring"><img class="circle" width="40" height="40" src="${src}" alt=""></span></div></section>`;
  };
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:Inter;src:url("${font}") format("woff2");font-weight:100 900}
    @font-face{font-family:VT323;src:url("${pixelFont}") format("woff2")}
    *{margin:0;box-sizing:border-box}body{position:relative;width:1500px;height:848px;overflow:hidden;background:#F386A1;color:#1E1E1E;font:24px VT323,'JetBrains Mono',monospace;padding:24px 30px}
    .frame{position:absolute;inset:16px;border:1px solid #1E1E1E;pointer-events:none}header{height:40px;font-size:28px}header span{border-bottom:2px solid #E551BA}
    main{display:grid;grid-template-columns:repeat(5,280px);grid-template-rows:repeat(2,372px);gap:12px 10px}
    .cell{display:flex;flex-direction:column;align-items:center;gap:6px}.name{height:24px;line-height:24px}.large{width:256px;height:256px}img{display:block}.samples{display:flex;align-items:center;gap:8px;height:80px}.circle{clip-path:circle(50%)}.ring{display:block;border-radius:50%;box-shadow:0 0 0 2px #1E1E1E}
  </style><body><div class="frame"></div><header><span>JEVPLAY.GAMES / ICON CHECK</span></header><main>${slugs.map(cell).join('')}</main></body>`;
}

async function main() {
  const opts = parse(process.argv.slice(2));
  if (!opts.pwDir || !opts.exe) throw new Error('usage: node art/render-icons.cjs <playwright-dir> <chromium-exe> [--out dir] [slug...]');
  const moduleDir = fs.existsSync(path.join(opts.pwDir, 'node_modules', 'playwright-core')) ? path.join(opts.pwDir, 'node_modules', 'playwright-core') : opts.pwDir;
  const { chromium } = require(path.resolve(moduleDir));
  const outDir = path.resolve(opts.out);
  fs.mkdirSync(outDir, { recursive: true });
  const have = ORDER;
  for (const slug of have) if (!fs.existsSync(emblem(slug))) throw new Error(`missing emblem: ${slug}`);
  const slugs = opts.slugs.length ? opts.slugs : have;
  const browser = await chromium.launch({ executablePath: opts.exe });
  const tmp = path.join(outDir, '.icon.html');
  const shot = async (html, width, height, file) => {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    try {
      fs.writeFileSync(tmp, html);
      await page.goto(pathToFileURL(tmp).href);
      await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode())]));
      await page.screenshot({ path: file, omitBackground: true });
    } finally { await page.close(); }
  };
  try {
    for (const slug of slugs) {
      if (!fs.existsSync(emblem(slug))) { console.error('missing emblem', slug); process.exitCode = 1; continue; }
      await shot(page1(emblem(slug), 1024), 1024, 1024, path.join(outDir, `${slug}-icon-1024.png`));
      if (slug !== BRAND.slug) {
        const publicDir = path.join(__dirname, '../public/brand/games');
        fs.mkdirSync(publicDir, { recursive: true });
        await shot(page1(emblem(slug), 320), 320, 320, path.join(publicDir, `${slug}.png`));
      }
      console.log('rendered', slug);
    }
    await shot(sheet(have), 1500, 848, path.join(outDir, 'icons-sheet.png'));
    console.log('rendered icons-sheet', have.length, 'emblems');
  } finally {
    await browser.close();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}
module.exports = { parse, page1, sheet };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
