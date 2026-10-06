// Offline landing artwork. Uses the Activity renderer's exact boards and brand.
// usage: node art/render-landing.cjs <playwright-dir> <chromium-exe> [outDir]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { ARCADE, GAMES, MOTIFS, shell, mark } = require('./render-art.cjs');
const emblemDir = path.join(__dirname, 'emblems');
const emblemUrl = slug => {
  const file = path.join(emblemDir, `${slug}.svg`);
  return fs.existsSync(file) ? pathToFileURL(file).href : null;
};
const tagline = 'Nine games. Pick one and play against JEV.';

function landing(width, height, icon = false) {
  const og = width === 1200;
  const tile = og ? 130 : 188;
  const gap = og ? 14 : 18;
  // Illustrated emblems; the old flat board tile only stands in while an emblem file is missing.
  const mosaic = GAMES.map(g => {
    const url = emblemUrl(g.slug);
    return url
      ? `<div class="tile emblem" style="--edge:${g.accent}"><img src="${url}" alt=""></div>`
      : `<div class="tile" style="--edge:${g.accent}"><svg viewBox="0 0 100 100">${MOTIFS[g.slug]()}</svg></div>`;
  }).join('');
  const arcade = emblemUrl('arcade');
  const logo = arcade ? `<img class="logo" src="${arcade}" alt="">` : mark;
  const content = icon
    ? `<div class="icon">${arcade ? `<img src="${arcade}" alt="">` : mark}</div>` : `
    <div class="brand">${logo}<span>${ARCADE.brand}</span></div>
    <div class="copy"><h1>JevPlay<br>Arcade</h1><p>${tagline}</p>
      <div class="chip"><i></i>Play against JEV</div></div>
    <div class="mosaic">${mosaic}</div><footer>${ARCADE.url}</footer>`;
  return shell(`<style>
    body{width:${width}px;height:${height}px}
    .glow{background:radial-gradient(ellipse at 82% 20%,#a99bff33,transparent 60%)}
    .grid{mask-image:radial-gradient(ellipse at 70% 45%,#000,transparent 75%)}
    .brand{position:absolute;left:${og ? 64 : 96}px;top:${og ? 48 : 80}px;display:flex;align-items:center;gap:16px;font-size:${og ? 17 : 20}px;font-weight:700;letter-spacing:.14em;color:#a3aabd}
    .brand svg,.brand .logo{width:${og ? 56 : 76}px;height:${og ? 56 : 76}px;border-radius:22%;box-shadow:0 6px 16px #00000088,0 0 18px #a99bff55}
    .copy{position:absolute;left:${og ? 64 : 96}px;top:${og ? 168 : 256}px;width:${og ? 590 : 720}px}
    h1{font-size:${og ? 108 : 136}px;line-height:.96;font-weight:800;letter-spacing:-.055em;color:#eef0f7}
    p{margin-top:${og ? 24 : 32}px;max-width:${og ? 530 : 680}px;font-size:${og ? 28 : 30}px;line-height:1.4;font-weight:600;color:#a99bff}
    .chip{display:inline-flex;align-items:center;gap:12px;margin-top:${og ? 24 : 36}px;padding:14px 22px;border-radius:999px;background:#ffffff0b;border:1px solid #2c3243;font-size:${og ? 19 : 22}px;font-weight:600}
    .chip i{width:11px;height:11px;border-radius:50%;background:#6fdcc8}
    .mosaic{position:absolute;right:${og ? 52 : 96}px;top:${og ? 102 : 150}px;display:grid;grid-template-columns:repeat(3,${tile}px);gap:${gap}px}
    .tile{width:${tile}px;height:${tile}px;padding:${og ? 9 : 14}px;background:#171a24;border:1px solid #2c3243;border-radius:${og ? 14 : 18}px;box-shadow:0 12px 28px #00000055,0 0 16px color-mix(in srgb,var(--edge) 16%,transparent),inset 0 1px 0 color-mix(in srgb,var(--edge) 38%,transparent)}
    .tile svg{display:block;width:100%;height:100%}
    .tile.emblem{padding:0;overflow:hidden;border:0;background:#0a0b13;border-radius:${og ? 24 : 32}px;box-shadow:0 0 0 1.5px color-mix(in srgb,var(--edge) 55%,#2c3243),0 14px 30px #000000aa,0 0 34px color-mix(in srgb,var(--edge) 38%,transparent)}
    .tile.emblem img{display:block;width:100%;height:100%}
    footer{position:absolute;left:${og ? 64 : 96}px;bottom:${og ? 32 : 64}px;color:#78809a;font-size:${og ? 15 : 18}px;letter-spacing:.06em}
    .icon{position:absolute;inset:0}
    .icon img,.icon svg{display:block;width:1024px;height:1024px}
    ${icon ? '.grid,.glow{display:none}' : ''}
  </style>${content}`, ARCADE.accent);
}

async function main() {
  const [pwDir, exe, outArg] = process.argv.slice(2);
  if (!pwDir || !exe) throw new Error('usage: node art/render-landing.cjs <playwright-dir> <chromium-exe> [outDir]');
  // Accept either the module itself or an installation directory containing it.
  const moduleDir = fs.existsSync(path.join(pwDir, 'node_modules', 'playwright-core'))
    ? path.join(pwDir, 'node_modules', 'playwright-core') : pwDir;
  const { chromium } = require(path.resolve(moduleDir));
  const outDir = path.resolve(outArg || path.join(__dirname, '..', 'public', 'brand'));
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: exe });
  try {
    for (const [name, width, height, icon] of [['arcade-hero', 1600, 900, false], ['arcade-og', 1200, 630, false], ['arcade-icon-1024', 1024, 1024, true]]) {
      const html = path.join(outDir, `.${name}.html`);
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      try {
        fs.writeFileSync(html, landing(width, height, icon));
        await page.goto(pathToFileURL(html).href);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(outDir, `${name}.png`) });
        if (name === 'arcade-icon-1024') fs.copyFileSync(path.join(outDir, `${name}.png`), path.join(outDir, 'discord-icon-1024.png'));
        console.log('rendered', name, `${width}x${height}`);
      } finally {
        await page.close();
        if (fs.existsSync(html)) fs.unlinkSync(html);
      }
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
