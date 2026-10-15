// Offline landing assets. No browser is started when this module is imported.
// usage: node art/render-landing.cjs <playwright-dir> <chromium-exe> [outDir]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const games = require('../games.json');
const brandDir = path.resolve(__dirname, '../public/brand');
const robot = fs.readFileSync(path.join(__dirname, 'src/jev-robot.svg'), 'utf8').trim();
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const font = name => pathToFileURL(path.join(brandDir, name)).href;

function iconSvg() {
  // Preserve every canonical shape and path; only the nested viewport has new dimensions.
  const shapes = robot.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges" role="img" aria-label="jevplay.games"><title>jevplay.games</title><rect x="1" y="1" width="62" height="62" rx="10" fill="#F386A1" stroke="#1E1E1E" stroke-width="2"/><svg x="6" y="12" width="52" height="40" viewBox="0 0 86 66">${shapes}</svg></svg>\n`;
}

function landing(width, height) {
  const og = width === 1200;
  const w = og ? 172 : 202, h = og ? 106 : 154;
  const stepX = w - 6, stepY = h + 12, stagger = og ? 26 : 24;
  const left = og ? 610 : 900, top = og ? 202 : 268;
  const windows = games.map((game, i) => {
    // Each game's approved drawing, unchanged (its own magenta included); the one-highlight rule is for hub chrome.
    const drawing = fs.readFileSync(path.join(__dirname, 'src/game-icons', `${game.slug}.svg`), 'utf8');
    return `<section class="window" style="left:${i % 3 * stepX}px;top:${Math.floor(i / 3) * stepY + i % 3 * stagger}px"><header><span>${escape(game.name.toUpperCase())}</span><span>_ x</span></header><div class="drawing">${drawing}</div></section>`;
  }).join('');
  // Adjacent windows overlap only the blank side margins below their title bars.
  // Drawings are centred with >= 35px side clearance; row spacing clears all drawings.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  @font-face{font-family:Inter;src:url("${font('inter-var.woff2')}") format('woff2');font-weight:100 900}
  @font-face{font-family:VT323;src:url("${font('vt323.woff2')}") format('woff2');font-weight:400}
  *{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#F386A1;color:#1E1E1E;font-family:VT323,'JetBrains Mono',monospace}
  .frame{position:absolute;inset:28px;border:1px solid #1E1E1E}
  .crop{position:absolute;width:18px;height:18px;border-color:#1E1E1E;border-style:solid;border-width:0}
  .tl{left:14px;top:14px;border-left-width:1px;border-top-width:1px}.tr{right:14px;top:14px;border-right-width:1px;border-top-width:1px}
  .bl{left:14px;bottom:14px;border-left-width:1px;border-bottom-width:1px}.br{right:14px;bottom:14px;border-right-width:1px;border-bottom-width:1px}
  .dots{position:absolute;opacity:.4;background-image:radial-gradient(circle,#1E1E1E 0 1px,#F386A1 1px);background-size:6px 6px;clip-path:ellipse(50% 50% at 50% 50%)}
  .a{left:${og ? 660 : 960}px;top:60px;width:420px;height:390px}.b{left:${og ? 390 : 590}px;bottom:42px;width:360px;height:230px}
  .tag{position:absolute;left:60px;top:54px;background:#1E1E1E;color:#F386A1;border:1px dotted #F386A1;outline:5px solid #1E1E1E;padding:4px 10px;font-size:24px;letter-spacing:.12em}
  h1{position:absolute;left:56px;top:${og ? 94 : 112}px;margin:0;font:700 ${og ? 104 : 136}px/1 Inter;letter-spacing:-.05em}
  .copy{position:absolute;left:60px;top:${og ? 296 : 390}px}
  .subtitle{margin:0;background:#1E1E1E;color:#FEFEFE;padding:10px 14px;font-size:${og ? 28 : 36}px;line-height:1.2;white-space:nowrap}
  .subtitle span{border-bottom:4px solid #E551BA}
  .chips{display:flex;gap:12px;margin-top:24px}.chips span{background:#DEDEDE;border:1px solid #1E1E1E;padding:5px 12px;font-size:${og ? 25 : 32}px}
  .cascade{position:absolute;left:${left}px;top:${top}px}
  .window{position:absolute;width:${w}px;height:${h}px;border:1px solid #1E1E1E;background:#DEDEDE;box-shadow:6px 6px 0 #1E1E1E,inset 0 0 0 2px #FEFEFE}
  header{height:24px;background:#1E1E1E;color:#FEFEFE;display:flex;justify-content:space-between;align-items:center;padding:0 5px;font-size:${og ? 18 : 20}px;white-space:nowrap}
  .drawing{height:${h - 25}px;display:flex;align-items:center;justify-content:center;padding:6px}
  .drawing svg{width:${og ? 64 : 112}px;height:${og ? 64 : 112}px}
  .mascot{position:absolute;left:${left - (og ? 140 : 170)}px;top:${top + stepY * 2 + h - (og ? 110 : 150)}px}
  .mascot svg{width:${og ? 170 : 200}px;height:${og ? 170 * 66 / 86 : 200 * 66 / 86}px}
  footer{position:absolute;left:60px;bottom:44px;font-size:24px}
  </style></head><body><div class="frame"></div><i class="crop tl"></i><i class="crop tr"></i><i class="crop bl"></i><i class="crop br"></i><div class="dots a"></div><div class="dots b"></div><div class="tag">JEVPLAY.GAMES</div><h1>jevplay.games</h1><div class="copy"><p class="subtitle">Nine games. Pick one. Play <span>Jev.</span></p><div class="chips"><span>+choice</span><span>+noul</span><span>+score</span></div></div><div class="mascot">${robot}</div><div class="cascade">${windows}</div><footer>jevplay.games</footer></body></html>`;
}

function writeStaticAssets(outDir = brandDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of ['icon.svg', 'mark.svg']) fs.writeFileSync(path.join(outDir, name), iconSvg());
  fs.copyFileSync(path.join(__dirname, 'out/hub-icon-1024.png'), path.join(outDir, 'icon-1024.png'));
}

async function main() {
  const [pwDir, exe, outArg] = process.argv.slice(2);
  if (!pwDir || !exe) throw new Error('usage: node art/render-landing.cjs <playwright-dir> <chromium-exe> [outDir]');
  const outDir = path.resolve(outArg || brandDir);
  writeStaticAssets(outDir);
  const moduleDir = fs.existsSync(path.join(pwDir, 'node_modules/playwright-core'))
    ? path.join(pwDir, 'node_modules/playwright-core') : pwDir;
  const { chromium } = require(path.resolve(moduleDir));
  const browser = await chromium.launch({ executablePath: exe });
  try {
    for (const [name, width, height] of [['hero', 1600, 900], ['og', 1200, 630], ['favicon-32', 32, 32], ['apple-touch-icon', 180, 180]]) {
      const html = path.join(outDir, `.${name}.html`);
      // Icons are drawn at 16x, then each output pixel takes the colour at the centre of its 16x16 block, snapped
      // to the nearest palette hex: every pixel is a palette colour of icon.svg, with no anti-aliased blends.
      const icon = name !== 'hero' && name !== 'og', k = icon ? 16 : 1;
      const page = await browser.newPage({ viewport: { width: width * k, height: height * k }, deviceScaleFactor: 1 });
      try {
        fs.writeFileSync(html, name === 'hero' || name === 'og' ? landing(width, height)
          : `<!doctype html><html><body style="margin:0;background:#F386A1"><img width="${width * k}" height="${height * k}" src="${pathToFileURL(path.join(outDir, 'icon.svg')).href}"></body></html>`);
        await page.goto(pathToFileURL(html).href);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(img => img.decode()));
        });
        const file = path.join(outDir, `${name}.png`);
        if (!icon) await page.screenshot({ path: file, omitBackground: false });
        else {
          // A file:// image taints the canvas, so sample a screenshot handed back as a data: URL instead.
          const shot = (await page.screenshot()).toString('base64');
          const png = await page.evaluate(async ({ w, h, k, palette, shot }) => {
            const img = new Image();
            img.src = `data:image/png;base64,${shot}`;
            await img.decode();
            const big = document.createElement('canvas');
            big.width = w * k; big.height = h * k;
            const bctx = big.getContext('2d');
            bctx.drawImage(img, 0, 0);
            const src = bctx.getImageData(0, 0, w * k, h * k).data, out = document.createElement('canvas');
            out.width = w; out.height = h;
            const octx = out.getContext('2d'), dst = octx.createImageData(w, h), pal = palette.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
              const i = ((y * k + k / 2) * w * k + x * k + k / 2) * 4;
              const best = pal.reduce((m, c) => { const d = (c[0] - src[i]) ** 2 + (c[1] - src[i + 1]) ** 2 + (c[2] - src[i + 2]) ** 2; return d < m[0] ? [d, c] : m; }, [Infinity])[1];
              dst.data.set([...best, 255], (y * w + x) * 4);
            }
            octx.putImageData(dst, 0, 0);
            return out.toDataURL('image/png').split(',')[1];
          }, { w: width, h: height, k, palette: [...new Set(fs.readFileSync(path.join(outDir, 'icon.svg'), 'utf8').match(/#[0-9A-Fa-f]{6}/g))], shot });
          fs.writeFileSync(file, Buffer.from(png, 'base64'));
        }
        console.log('rendered', name, `${width}x${height}`);
      } finally { await page.close(); fs.rmSync(html, { force: true }); }
    }
  } finally { await browser.close(); }
  // The hub's Discord kit keeps its social card beside the games' (art/out/<slug>-og.png): the same bytes as og.png.
  if (outDir === brandDir) fs.copyFileSync(path.join(outDir, 'og.png'), path.join(__dirname, 'out/hub-og.png'));
}
module.exports = { landing, iconSvg, writeStaticAssets };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
