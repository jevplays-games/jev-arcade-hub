// Records the 10 second, 640x360 Activity preview video for each game (Discord: mp4, <= 0.5 MB).
// usage: node art/render-video.cjs <playwright-module-dir> <chromium-executable> [outDir] [slug...]
// Needs ffmpeg on PATH. The scene is the cover artwork, animated with CSS only.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { GAMES, cover } = require('./render-art.cjs');
const [pwDir, exe, outArg, ...only] = process.argv.slice(2);
if (!pwDir || !exe) { console.error('usage: node art/render-video.cjs <playwright-dir> <chromium-exe> [outDir] [slug...]'); process.exit(1); }
const { chromium } = require(pwDir);
const outDir = path.resolve(outArg || path.join(__dirname, 'out'));
fs.mkdirSync(outDir, { recursive: true });

// The cover page, scaled to 640x360, with staged animation. Pieces of the board pop in one by one.
const scene = g => {
  const html = cover(g);
  const style = `<style>
    html,body{width:640px;height:360px;overflow:hidden;background:#0e1017}
    body{transform:scale(.625);transform-origin:0 0;width:1024px;height:576px}
    @keyframes rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
    @keyframes pop{0%{opacity:0;transform:scale(.4)}70%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
    @keyframes breathe{0%,100%{filter:drop-shadow(0 24px 40px #00000088)}50%{filter:drop-shadow(0 24px 56px var(--a))}}
    @keyframes fadeout{from{opacity:1}to{opacity:0}}
    @keyframes fadein{from{opacity:0}to{opacity:1}}
    .pop{transform-box:fill-box;transform-origin:center;opacity:0;animation:pop .42s cubic-bezier(.2,.9,.3,1.2) forwards}
    .stage{animation:fadeout .5s 9.5s forwards}
  </style>`;
  const script = `<script>
    document.documentElement.style.setProperty('--a','${g.accent}');
    const body=document.body;
    const wrap=document.createElement('div');wrap.className='stage';wrap.style.cssText='position:absolute;inset:0';
    while(body.firstChild)wrap.appendChild(body.firstChild);body.appendChild(wrap);
    const [brand,text,art,url]=[...wrap.children].filter(e=>e.tagName==='DIV').slice(2);
    if(brand){brand.style.animation='fadein .6s .1s both'}
    if(text){const t=text.children;t[0].style.animation='rise .7s .3s both cubic-bezier(.2,.8,.2,1)';t[1].style.animation='rise .7s .8s both';t[2].style.animation='rise .7s 1.3s both'}
    if(url){url.style.animation='fadein .8s 1.8s both'}
    const svg=art&&art.querySelector('svg');
    if(svg){
      const kids=[...svg.children];
      // the first element is usually the board itself: show it at once, then pop the rest in order
      const rest=kids.slice(1);
      const total=6.2, step=Math.min(.16,total/Math.max(rest.length,1));
      rest.forEach((el,i)=>{el.classList.add('pop');el.style.animationDelay=(1.6+i*step)+'s'});
      art.style.animation='rise .8s .5s both, breathe 2.6s 7s infinite';
    }
  <\/script>`;
  return html.replace('</style>', '</style>' + style).replace('</body>', script + '</body>');
};

(async () => {
  const browser = await chromium.launch({ executablePath: exe });
  for (const g of GAMES.filter(x => !only.length || only.includes(x.slug))) {
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
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.45', '-i', path.join(tmp, webm), '-t', '10', '-vf', 'fps=24,scale=640:360', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '31', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { shell: true });
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(g.slug, Math.round(fs.statSync(mp4).size / 1024) + ' KB');
  }
  await browser.close();
})();
