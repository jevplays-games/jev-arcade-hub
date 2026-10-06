// Records the 10 second, 640x360 Activity preview video for each game (Discord: mp4, <= 0.5 MB).
// usage: node art/render-video.cjs <playwright-module-dir> <chromium-executable> [outDir] [slug...]
// Needs ffmpeg on PATH. The scene is the cover artwork, animated with CSS only. With no slug it renders all ten
// (nine games plus the hub); name slugs to render only those.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { ARCADE, GAMES, cover } = require('./render-art.cjs');
const [pwDir, exe, outArg, ...only] = process.argv.slice(2);
if (!pwDir || !exe) { console.error('usage: node art/render-video.cjs <playwright-dir> <chromium-exe> [outDir] [slug...]'); process.exit(1); }
const { chromium } = require(pwDir);
const outDir = path.resolve(outArg || path.join(__dirname, 'out'));
fs.mkdirSync(outDir, { recursive: true });
const CRF = process.env.VIDEO_CRF || '24';

// The cover page, scaled to 640x360, animated through the cover's own class names: the tile rises in and settles,
// title, tagline and chip follow, the glow breathes and a shine crosses the emblem twice. Grain is dropped from
// the page (it costs bitrate); the emblem keeps its own.
const scene = g => {
  const html = cover(g);
  const style = `<style>
    html,body{width:640px;height:360px;overflow:hidden;background:#0a0b13}
    body{transform:scale(.625);transform-origin:0 0;width:1024px;height:576px}
    .grain{display:none}
    @keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
    @keyframes tileIn{0%{opacity:0;transform:translateY(90px) scale(.86)}60%{opacity:1;transform:translateY(-8px) scale(1.015)}100%{opacity:1;transform:none}}
    @keyframes fadein{from{opacity:0}to{opacity:1}}
    @keyframes breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    @keyframes shine{0%{left:-60%;opacity:1}35%,100%{left:130%;opacity:1}}
    @keyframes fadeto{from{opacity:0}to{opacity:1}}
    .brand{animation:fadein .6s .1s both}
    .t1{animation:rise .7s .5s both cubic-bezier(.2,.8,.2,1)}
    .t2{animation:rise .7s 1s both cubic-bezier(.2,.8,.2,1)}
    .chip{animation:rise .7s 1.5s both cubic-bezier(.2,.8,.2,1)}
    .url{animation:fadein .8s 2s both}
    .hero{animation:tileIn 1.3s .3s both cubic-bezier(.2,.8,.25,1)}
    .main .halo{animation:breathe 3.2s 1.6s infinite ease-in-out}
    .main>div:last-child{animation:bob 4s 1.6s infinite ease-in-out}
    .s1{animation:fadein 1.2s .9s both}
    .s2{animation:fadein 1.2s 1.2s both}
    .s3{animation:fadein 1.2s 1.5s both}
    .shine{animation:shine 4s 3.4s 2 ease-in-out both}
    body::after{content:"";position:absolute;inset:0;background:#0a0b13;opacity:0;pointer-events:none;animation:fadeto .5s 9.5s forwards}
  </style>`;
  return html.replace('</style>', '</style>' + style);
};

(async () => {
  const browser = await chromium.launch({ executablePath: exe });
  for (const g of [...GAMES, ARCADE].filter(x => !only.length || only.includes(x.slug))) {
    const tmp = path.join(outDir, `.rec-${g.slug}`);
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    const htmlFile = path.join(tmp, 'scene.html');
    fs.writeFileSync(htmlFile, scene(g));
    const ctx = await browser.newContext({ viewport: { width: 640, height: 360 }, recordVideo: { dir: tmp, size: { width: 640, height: 360 } } });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(htmlFile).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(11900);
    await ctx.close();
    const webm = fs.readdirSync(tmp).find(f => f.endsWith('.webm'));
    const mp4 = path.join(outDir, `${g.slug}-preview.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.45', '-i', path.join(tmp, webm), '-t', '10', '-vf', 'fps=24,scale=640:360', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { shell: true });
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(g.slug, Math.round(fs.statSync(mp4).size / 1024) + ' KB');
  }
  await browser.close();
})();
