// Offline 10-second, 640x360 Activity previews. Importing this module never launches tools.
// usage: node art/render-video.cjs <playwright-dir> <chromium-exe> [outDir] [slug...]
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { BRAND, GAMES } = require('./brand.cjs');
const { cover } = require('./render-art.cjs');
const MAX_BYTES = 500000;
const escape = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function scene(g) {
  // Keep the cover's layout and exact approved mascot, including its original viewBox.
  const robot = fs.readFileSync(path.join(__dirname, 'src/jev-robot.svg'), 'utf8').trim();
  let html = cover(g).replace(/<img src="[^"]*\/jev-robot\.svg" alt="">/g, () => robot);
  // SVG dots replace the cover's radial-gradient; opacity never introduces extra palette hexes.
  const dots = id => `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#1E1E1E"/></pattern></defs><rect width="100%" height="100%" fill="url(#${id})" opacity=".4"/></svg>`;
  html = html.replace(/background:radial-gradient\([^;]+;/g, '')
    .replace('<body>', `<body><div class="dot-grid">${dots('grid-dots')}</div>`)
    .replace('<div class="blob blob-top"></div>', `<div class="blob blob-top">${dots('top-dots')}</div>`)
    .replace('<div class="blob blob-bottom"></div>', `<div class="blob blob-bottom">${dots('bottom-dots')}</div>`);
  const chars = Array.from(g.tagline);
  const lastWord = g.tagline.search(/\S+\s*$/);
  let offset = 0;
  const typed = chars.map((char, i) => {
    const start = offset;
    offset += char.length;
    return `${start === lastWord ? '<span class="tagline-last">' : ''}<span class="letter" style="animation-delay:${(2.4 + 2.6 * (i + 1) / chars.length).toFixed(4)}s">${escape(char)}</span>`;
  }).join('') + '</span><span class="cursor" aria-hidden="true"></span>';
  html = html.replace(/<div class="tagline">[\s\S]*?<\/div>/, () => `<div class="tagline"><span class="typing-space" aria-hidden="true">${escape(g.tagline)}</span><span class="typing">${typed}</span></div>`);
  const style = `<style>
    html{width:640px;height:360px;overflow:hidden;background:#F386A1}
    body{transform:scale(.625);transform-origin:0 0;width:1024px;height:576px}
    .dot-grid{position:absolute;inset:32px;pointer-events:none}
    .blob{background:none}
    .body>.robot{width:100%;height:100%}
    .window{box-shadow:6px 6px 0 #1E1E1E}
    @keyframes appear{from{visibility:hidden}to{visibility:visible}}
    @keyframes type-letter{from{font-size:0;visibility:hidden}to{font-size:26px;visibility:visible}}
    @keyframes cursor-blink{0%{background:#FEFEFE}50%{background:#1E1E1E}}
    @keyframes underline{from{border-bottom-color:transparent}to{border-bottom-color:#E551BA}}
    @keyframes highlight{0%,33.333%,66.666%{border-bottom-color:#E551BA}16.666%,50%,83.333%,100%{border-bottom-color:#1E1E1E}}
    .win-main{animation:appear 0s .4s steps(1) both}
    .win-jev{animation:appear 0s 1.2s steps(1) both}
    .tag,.title{animation:appear 0s 1.8s steps(1) both}
    .dot-grid{animation:appear 0s .4s steps(1) both}
    .tagline{position:relative;white-space:nowrap;animation:appear 0s 2.4s steps(1) both}
    .typing-space{visibility:hidden}
    .typing{position:absolute;top:8px;left:12px;width:max-content}
    .letter{animation:type-letter 0s steps(1) both}
    .cursor{position:absolute;left:100%;top:0;width:13px;height:26px;animation:cursor-blink 1s 2.4s steps(1) infinite}
    .tagline-last{border-bottom-color:transparent;animation:underline 0s 5s steps(1) both,highlight .9s 8.5s steps(1) forwards}
    .url{animation:appear 0s 5.4s steps(1) both}
    ${GAMES.map((_, i) => `.win-hub .mosaic>img:nth-child(${i + 1}){animation:appear 0s ${(.6 + i / 8).toFixed(3)}s steps(1) both}`).join('\n')}
    /* Start the entire CSS timeline together after local fonts and images have loaded. */
    body:not(.playing),body:not(.playing) *,body:not(.playing) *::before,body:not(.playing) *::after{animation-play-state:paused!important}
  </style>`;
  return html.replace('</style>', '</style>' + style);
}

function cleanOutputs(outDir) {
  const keep = new Set([...GAMES, BRAND].map(g => `${g.slug}-preview.mp4`));
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.mp4') && !keep.has(entry.name)) {
      fs.unlinkSync(path.join(outDir, entry.name));
    }
  }
}

function encode(webm, mp4, start, initialCRF, run = execFileSync) {
  for (let crf = initialCRF; ; crf = Math.min(51, crf + 2)) {
    run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(start), '-i', webm, '-t', '10', '-vf', 'fps=24,scale=640:360', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    const bytes = fs.statSync(mp4).size;
    console.log(`${path.basename(mp4)}: ${bytes} bytes (${(bytes / 1000).toFixed(1)} KB), CRF ${crf}`);
    if (bytes <= MAX_BYTES) return;
    if (crf === 51) {
      fs.rmSync(mp4, { force: true });
      throw new Error(`${path.basename(mp4)} exceeds ${MAX_BYTES} bytes even at CRF 51`);
    }
  }
}

async function main() {
  const [pwDir, exe, outArg, ...only] = process.argv.slice(2);
  if (!pwDir || !exe) throw new Error('usage: node art/render-video.cjs <playwright-dir> <chromium-exe> [outDir] [slug...]');
  const crf = Number(process.env.VIDEO_CRF || '24');
  if (!Number.isInteger(crf) || crf < 0 || crf > 51) throw new Error('VIDEO_CRF must be an integer from 0 to 51');
  const catalog = [...GAMES, BRAND];
  for (const slug of only) if (!catalog.some(g => g.slug === slug)) throw new Error(`Unknown slug: ${slug}`);
  const outDir = path.resolve(outArg || path.join(__dirname, 'out'));
  fs.mkdirSync(outDir, { recursive: true });
  cleanOutputs(outDir);
  const { chromium } = require(path.resolve(pwDir));
  const browser = await chromium.launch({ executablePath: exe });
  try {
    for (const g of catalog.filter(g => !only.length || only.includes(g.slug))) {
      const tmp = path.join(outDir, `.rec-${g.slug}`);
      fs.rmSync(tmp, { recursive: true, force: true });
      fs.mkdirSync(tmp, { recursive: true });
      try {
        const htmlFile = path.join(tmp, 'scene.html');
        fs.writeFileSync(htmlFile, scene(g));
        // Prime fonts, decoded images and painting before creating a recorder.
        // Each recording still gets a fresh page with its timeline paused at zero.
        const ready = async page => {
          await page.goto(pathToFileURL(htmlFile).href);
          await page.evaluate(async () => {
            await Promise.all([document.fonts.ready, ...Array.from(document.images, img => img.decode())]);
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          });
        };
        const warmup = await browser.newContext({ viewport: { width: 640, height: 360 } });
        try { await ready(await warmup.newPage()); }
        finally { await warmup.close(); }
        const ctx = await browser.newContext({ viewport: { width: 640, height: 360 }, recordVideo: { dir: tmp, size: { width: 640, height: 360 } } });
        let start;
        try {
          const page = await ctx.newPage();
          const captureStarted = performance.now();
          await ready(page);
          // Let the recorder receive settled, paused frames before the trim point.
          await page.waitForTimeout(250);
          // Keep the recorded lead-in out of the export. The timeline stays paused
          // through navigation and asset loading; only the ten-second scene is kept.
          start = (performance.now() - captureStarted) / 1000;
          await page.evaluate(() => document.body.classList.add('playing'));
          await page.waitForTimeout(11900);
        } finally { await ctx.close(); }
        const webm = fs.readdirSync(tmp).find(f => f.endsWith('.webm'));
        if (!webm) throw new Error(`No recording for ${g.slug}`);
        encode(path.join(tmp, webm), path.join(outDir, `${g.slug}-preview.mp4`), start, crf);
      } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    }
  } finally { await browser.close(); }
}
module.exports = { scene, cleanOutputs, encode, MAX_BYTES };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
