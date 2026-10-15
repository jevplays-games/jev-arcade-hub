// Offline Activity artwork. No browser is launched when this module is imported.
// usage: node art/render-art.cjs <playwright-dir> <chromium-exe> [outDir]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { BRAND, GAMES, ORDER } = require('./brand.cjs');
const fileUrl = file => pathToFileURL(path.resolve(__dirname, file)).href;
const font = fileUrl('../public/brand/inter-var.woff2');
const pixelFont = fileUrl('../public/brand/vt323.woff2');
const drawingImg = slug => `<img src="${fileUrl(slug === BRAND.slug ? 'src/jev-robot.svg' : `src/game-icons/${slug}.svg`)}" alt="">`;
const escape = value => String(value).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hasEmblem = slug => fs.existsSync(path.join(__dirname, 'emblems', `${slug}.svg`));
const emblemImg = (slug, size) => `<img src="${fileUrl(`emblems/${slug}.svg`)}" width="${size}" height="${size}" alt="">`;
const shell = inner => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url("${font}") format("woff2");font-weight:100 900}
@font-face{font-family:VT323;src:url("${pixelFont}") format("woff2");font-weight:400}
*{box-sizing:border-box;margin:0}
body{position:relative;width:1024px;height:576px;overflow:hidden;background:#F386A1;color:#1E1E1E;font:26px VT323,'JetBrains Mono',monospace}
img{display:block}
.frame{position:absolute;inset:16px;border:1px solid #1E1E1E;pointer-events:none}
.crop{position:absolute;width:18px;height:18px;border:solid #1E1E1E;border-width:1px 0 0 1px}
.tl{top:8px;left:8px}.tr{top:8px;right:8px;transform:rotate(90deg)}.br{bottom:8px;right:8px;transform:rotate(180deg)}.bl{bottom:8px;left:8px;transform:rotate(270deg)}
.blob{position:absolute;width:300px;height:300px;background:radial-gradient(#1E1E1E66 1.2px,transparent 1.6px) 0 0/6px 6px;clip-path:circle(50%)}
.blob-top{right:-110px;top:-90px}.blob-bottom{left:-110px;bottom:-110px}
.tag{position:absolute;left:48px;top:48px;background:#1E1E1E;color:#F386A1;padding:7px 12px;border:1px dotted #F386A1;outline:4px solid #1E1E1E;font-size:24px}
.copy{position:absolute;left:48px;top:192px;width:540px}
.title{font-family:Inter,sans-serif;font-weight:700;letter-spacing:-.05em;line-height:1.08;white-space:nowrap}
.tagline{display:table;max-width:530px;margin-top:24px;background:#1E1E1E;color:#FEFEFE;padding:8px 12px;font-size:26px;line-height:1.08}
.url{display:table;margin-top:22px;padding:7px 12px;background:#DEDEDE;border:1px solid #1E1E1E;font-size:24px}
.window{position:absolute;background:#DEDEDE;border:1px solid #1E1E1E;box-shadow:6px 6px 0 #1E1E1E}
.bar{height:28px;background:#1E1E1E;color:#FEFEFE;display:flex;align-items:center;justify-content:space-between;padding:0 9px;font-size:22px}
.body{border-top:2px solid #FEFEFE;border-left:2px solid #FEFEFE;padding:14px;display:flex;align-items:center;justify-content:center}
.win-main{right:50px;top:116px;width:334px}.win-main .body{height:280px;padding:8%}
.body>img{width:100%;height:100%;object-fit:contain}
.win-jev{right:28px;top:424px;width:166px}.win-jev .body{height:112px;padding:8%}
.win-hub .body{padding:12px}
.win-jev-hub{left:500px;right:auto}
.mosaic{display:grid;grid-template-columns:repeat(3,78px);gap:10px}
.mosaic>img{width:78px;height:78px;padding:0;border:1px solid #1E1E1E;background:#DEDEDE}
.tagline-last{border-bottom:4px solid #E551BA}
.edge-window{width:260px}.edge-window .body{height:258px;padding:8%}.edge-left{left:-62px;bottom:-62px}.edge-right{right:-62px;top:-62px}
.background .blob{width:190px;height:190px}
</style><body>${inner}</body>`;
const ground = () => `<div class="blob blob-top"></div><div class="blob blob-bottom"></div><div class="frame"></div>${['tl', 'tr', 'br', 'bl'].map(c => `<i class="crop ${c}"></i>`).join('')}`;
const windowHtml = (cls, title, content, silent = false) => `<div class="window ${cls}"><div class="bar">${silent ? '' : `<span>${escape(title)}</span><span>_ x</span>`}</div><div class="body">${content}</div></div>`;
const cover = g => {
  const hub = g.slug === BRAND.slug;
  const size = g.name.length > 11 ? 70 : 84;
  const content = hub ? `<div class="mosaic">${ORDER.filter(s => s !== BRAND.slug).map(s => drawingImg(s)).join('')}</div>` : drawingImg(g.slug);
  const tagline = escape(g.tagline).replace(/(\S+)(\s*)$/, '<span class="tagline-last">$1</span>$2');
  return shell(`${ground()}<div class="tag">JEVPLAY.GAMES${hub ? '' : '/' + escape(g.slug.toUpperCase())}</div>
<div class="copy"><h1 class="title" style="font-size:${size}px">${escape(g.name)}</h1><div class="tagline">${tagline}</div><div class="url">${hub ? 'jevplay.games' : escape(g.slug) + '.jevplay.games'}</div></div>
${windowHtml(hub ? 'win-main win-hub' : 'win-main', hub ? 'GAMES' : g.slug.toUpperCase(), content)}${windowHtml(hub ? 'win-jev win-jev-hub' : 'win-jev', 'JEV', drawingImg(BRAND.slug))}`);
};
const background = g => shell(`<div class="background">${ground()}${windowHtml('edge-window edge-left', '', drawingImg(g.slug), true)}${windowHtml('edge-window edge-right', '', drawingImg(g.slug), true)}</div>`);
// Compatibility for the separate landing renderer: always use the approved emblems.
const svg = (slug, size) => emblemImg(slug, size);
const MOTIFS = Object.fromEntries(ORDER.map(slug => [slug, () => `<image href="${fileUrl(`emblems/${slug}.svg`)}" width="100" height="100"/>`]));
module.exports = { cover, background, shell, font, pixelFont, ground, hasEmblem, svg, MOTIFS };
async function main() {
  const [pwDir, exe, outArg] = process.argv.slice(2);
  if (!pwDir || !exe) throw new Error('usage: node art/render-art.cjs <playwright-dir> <chromium-exe> [outDir]');
  const moduleDir = fs.existsSync(path.join(pwDir, 'node_modules/playwright-core')) ? path.join(pwDir, 'node_modules/playwright-core') : pwDir;
  const { chromium } = require(path.resolve(moduleDir));
  const outDir = path.resolve(outArg || path.join(__dirname, 'out'));
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: exe });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 576 }, deviceScaleFactor: 1 });
    for (const slug of ORDER) {
      const g = [...GAMES, BRAND].find(g => g.slug === slug);
      for (const [kind, render] of [['cover', cover], ['background', background]]) {
        const html = path.join(outDir, `.${slug}-${kind}.html`);
        try {
          fs.writeFileSync(html, render(g));
          await page.goto(pathToFileURL(html).href);
          await page.evaluate(() => Promise.all([document.fonts.ready, ...Array.from(document.images, img => img.decode())]));
          await page.screenshot({ path: path.join(outDir, `${slug}-${kind}.png`) });
        } finally { fs.rmSync(html, { force: true }); }
      }
      console.log('rendered', slug);
    }
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
