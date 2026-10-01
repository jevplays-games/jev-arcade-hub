// Renders Discord Activity artwork (Cover Art and Background, 1024x576) for the nine games.
// usage: node art/render-art.cjs <playwright-module-dir> <chromium-executable> [outDir]
// Fonts come from public/brand/inter-var.woff2. Nothing here needs network access.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const isMain = require.main === module;
const [pwDir, exe, outArg] = isMain ? process.argv.slice(2) : [];
if (isMain && (!pwDir || !exe)) { console.error('usage: node art/render-art.cjs <playwright-dir> <chromium-exe> [outDir]'); process.exit(1); }
const font = pathToFileURL(path.join(__dirname, '..', 'public', 'brand', 'inter-var.woff2')).href;

const cell = (x, y, s, fill, r = 3, extra = '') => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${fill}" ${extra}/>`;

const MOTIFS = {
  'tic-tac-toe': (a = '#a99bff', b = '#6fdcc8') => `
    <g stroke="#3a3f57" stroke-width="3" stroke-linecap="round"><path d="M38 12V88M62 12V88M12 38H88M12 62H88"/></g>
    <g stroke="${a}" stroke-width="5" stroke-linecap="round"><path d="M18 18l14 14M32 18L18 32"/><path d="M42 42l14 14M56 42L42 56"/><path d="M66 66l14 14M80 66L66 80"/></g>
    <g stroke="${b}" stroke-width="5" fill="none"><circle cx="50" cy="25" r="8"/><circle cx="25" cy="50" r="8"/><circle cx="75" cy="50" r="8"/></g>`,
  'connect-four': () => {
    const rows = ['.......', '.......', '...Y...', '..RY...', '.RYR...', 'RYRY.Y.'];
    let s = '<rect x="4" y="10" width="92" height="80" rx="8" fill="#1d2b63"/>';
    rows.forEach((row, r) => [...row].forEach((c, i) => {
      const fill = c === 'R' ? '#ff6b6b' : c === 'Y' ? '#f5c451' : '#0e1017';
      s += `<circle cx="${14 + i * 12}" cy="${21 + r * 12.4}" r="4.8" fill="${fill}"/>`;
    }));
    return s;
  },
  checkers: () => {
    let s = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) s += cell(6 + c * 11, 6 + r * 11, 11, (r + c) % 2 ? '#5a3a2a' : '#e8d9b5', 0);
    const put = (r, c, col) => s += `<circle cx="${11.5 + c * 11}" cy="${11.5 + r * 11}" r="4.2" fill="${col}" stroke="#00000055" stroke-width=".6"/><circle cx="${11.5 + c * 11}" cy="${11.5 + r * 11}" r="2.4" fill="none" stroke="#ffffff33" stroke-width=".6"/>`;
    [[0, 1], [0, 3], [1, 2], [2, 5]].forEach(([r, c]) => put(r, c, '#2a2d3a'));
    [[5, 0], [6, 1], [5, 4], [4, 3]].forEach(([r, c]) => put(r, c, '#e5484d'));
    return s;
  },
  'dots-and-boxes': (a = '#2dd4bf', b = '#f472b6') => {
    let s = '';
    const p = i => 14 + i * 24;
    s += `<rect x="${p(0)}" y="${p(0)}" width="24" height="24" fill="${a}" opacity=".35"/><rect x="${p(1)}" y="${p(0)}" width="24" height="24" fill="${b}" opacity=".35"/><rect x="${p(1)}" y="${p(1)}" width="24" height="24" fill="${a}" opacity=".35"/>`;
    const line = (x1, y1, x2, y2, c) => `<path d="M${p(x1)} ${p(y1)}L${p(x2)} ${p(y2)}" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`;
    s += line(0, 0, 1, 0, a) + line(1, 0, 2, 0, b) + line(0, 0, 0, 1, a) + line(0, 1, 1, 1, a) + line(1, 0, 1, 1, b) + line(2, 0, 2, 1, b) + line(1, 1, 2, 1, b) + line(1, 1, 1, 2, a) + line(2, 1, 2, 2, a) + line(1, 2, 2, 2, a);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s += `<circle cx="${p(c)}" cy="${p(r)}" r="3" fill="#eef0f7"/>`;
    return s;
  },
  'guess-who': () => {
    const tones = ['#f6c9a8', '#e0a98a', '#c98b6b', '#f3d9c1'], hair = ['#4b3621', '#222', '#c9772b', '#8a8a8a', '#e6c04d'];
    let s = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = 8 + c * 22, y = 12 + r * 27, out = (r * 4 + c) % 5 === 2, i = r * 4 + c;
      s += `<g opacity="${out ? '.28' : '1'}"><rect x="${x}" y="${y}" width="19" height="24" rx="3" fill="#232838" stroke="#3a4058" stroke-width=".8"/>
        <circle cx="${x + 9.5}" cy="${y + 11}" r="6.2" fill="${tones[i % 4]}"/><path d="M${x + 3.3} ${y + 10}a6.2 6.4 0 0 1 12.4 0c-3-2.6-9.4-2.6-12.4 0z" fill="${hair[i % 5]}"/>
        <circle cx="${x + 7.4}" cy="${y + 11.5}" r=".8" fill="#222"/><circle cx="${x + 11.6}" cy="${y + 11.5}" r=".8" fill="#222"/><path d="M${x + 7.6} ${y + 14.2}q1.9 1.4 3.8 0" stroke="#7a3f2a" stroke-width=".7" fill="none"/>
        <rect x="${x + 2.5}" y="${y + 19}" width="14" height="2.4" rx="1.2" fill="#3a4058"/></g>`;
      if (out) s += `<path d="M${x + 2} ${y + 2}L${x + 17} ${y + 22}M${x + 17} ${y + 2}L${x + 2} ${y + 22}" stroke="#f87171" stroke-width="1.6" opacity=".9"/>`;
    }
    return s;
  },
  mastermind: () => {
    const cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];
    const rows = [[0, 3, 2, 4], [1, 1, 5, 3], [4, 2, 2, 0], [3, 5, 1, 4]], fb = [[2, 1], [1, 2], [3, 0], [4, 0]];
    let s = '';
    rows.forEach((row, r) => {
      const y = 12 + r * 21;
      s += `<rect x="5" y="${y - 8}" width="90" height="17" rx="8.5" fill="#1a1e2b"/>`;
      row.forEach((c, i) => s += `<circle cx="${17 + i * 15}" cy="${y}" r="5.4" fill="${cols[c]}"/><circle cx="${15.5 + i * 15}" cy="${y - 1.6}" r="1.4" fill="#ffffff66"/>`);
      const [ex, ne] = fb[r];
      for (let k = 0; k < 4; k++) s += `<circle cx="${78 + (k % 2) * 7}" cy="${y - 3.5 + Math.floor(k / 2) * 7}" r="2.4" fill="${k < ex ? '#eef0f7' : k < ex + ne ? '#6b7290' : '#2a2f42'}"/>`;
    });
    return s;
  },
  minesweeper: () => {
    const g = ['1 1 . . .', '2 X 2 1 .', 'F 3 X 1 .', '1 1 1 1 .'], colr = { 1: '#60a5fa', 2: '#4ade80', 3: '#f87171' };
    let s = '';
    g.forEach((row, r) => row.split(' ').forEach((t, c) => {
      const x = 8 + c * 17.6, y = 14 + r * 17.6, open = t !== 'F' && t !== '.' ? true : t === '.';
      s += cell(x, y, 16, t === 'F' ? '#2f6f4f' : open ? '#1a1e2b' : '#2a3a34', 2.4, `stroke="#3a4058" stroke-width=".7"`);
      if (colr[t]) s += `<text x="${x + 8}" y="${y + 12}" font-size="11" font-weight="800" text-anchor="middle" fill="${colr[t]}">${t}</text>`;
      if (t === 'X') s += `<circle cx="${x + 8}" cy="${y + 8}" r="4.4" fill="#eef0f7"/><path d="M${x + 8} ${y + 1.5}v13M${x + 1.5} ${y + 8}h13M${x + 3.4} ${y + 3.4}l9.2 9.2M${x + 12.6} ${y + 3.4}l-9.2 9.2" stroke="#eef0f7" stroke-width="1.4"/>`;
      if (t === 'F') s += `<path d="M${x + 5.6} ${y + 13}V3.6l7 3.2-7 3.2" fill="#f87171" stroke="#f87171" stroke-width="1.2" stroke-linejoin="round"/>`;
    }));
    return s;
  },
  sudoku: () => {
    const digits = ['5 3 . . 7 . . . .', '6 . . 1 9 5 . . .', '. 9 8 . . . . 6 .', '8 . . . 6 . . . 3', '4 . . 8 . 3 . . 1', '. . . . 2 . . . 6', '. 6 . . . . 2 8 .', '. . . 4 1 9 . . 5', '. . . . 8 . . 7 9'];
    let s = '<rect x="4" y="4" width="92" height="92" rx="4" fill="#1a1e2b"/>';
    for (let i = 0; i <= 9; i++) { const w = i % 3 === 0 ? 1.1 : .35; s += `<path d="M${5 + i * 10} 5V95M5 ${5 + i * 10}H95" stroke="${i % 3 === 0 ? '#60a5fa' : '#3a4058'}" stroke-width="${w}"/>`; }
    digits.forEach((row, r) => row.split(' ').forEach((d, c) => { if (d !== '.') s += `<text x="${10 + c * 10}" y="${13 + r * 10}" font-size="7.4" font-weight="700" text-anchor="middle" fill="${(r * 9 + c) % 4 ? '#eef0f7' : '#60a5fa'}">${d}</text>`; }));
    return s;
  },
  2048: () => {
    const T = { 2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'], 8: ['#f2b179', '#fff'], 16: ['#f59563', '#fff'], 32: ['#f67c5f', '#fff'], 64: ['#f65e3b', '#fff'], 128: ['#edcf72', '#fff'], 256: ['#edcc61', '#fff'], 512: ['#edc850', '#fff'], 1024: ['#edc53f', '#fff'], 2048: ['#edc22e', '#fff'] };
    const g = [[2, 4, 8, 16], [4, 8, 16, 32], [16, 32, 64, 128], [512, 256, 1024, 2048]];
    let s = '<rect x="4" y="4" width="92" height="92" rx="6" fill="#3a3530"/>';
    g.forEach((row, r) => row.forEach((v, c) => {
      const [bg, fg] = T[v], x = 8 + c * 22, y = 8 + r * 22;
      s += cell(x, y, 20, bg, 3) + `<text x="${x + 10}" y="${y + 13}" font-size="${v > 999 ? 7.2 : v > 99 ? 8.6 : 10.5}" font-weight="800" text-anchor="middle" fill="${fg}">${v}</text>`;
    }));
    return s;
  },
};

// The hub: a 3x3 mosaic of the nine game boards, each motif scaled into its own tile.
MOTIFS.arcade = () => {
  const order = ['tic-tac-toe', 'connect-four', 'checkers', 'dots-and-boxes', 'guess-who', 'mastermind', 'minesweeper', 'sudoku', '2048'];
  let s = '';
  order.forEach((slug, i) => {
    const x = 2 + (i % 3) * 32.7, y = 2 + Math.floor(i / 3) * 32.7;
    s += `<g transform="translate(${x} ${y}) scale(.3)"><rect x="-2" y="-2" width="104" height="104" rx="9" fill="#171a24" stroke="#ffffff22" stroke-width="1.2"/>${MOTIFS[slug]()}</g>`;
  });
  return s;
};

const GAMES = [
  { slug: 'tic-tac-toe', title: 'Tic-Tac-Toe', accent: '#a99bff', tag: 'Three in a row against JEV' },
  { slug: 'connect-four', title: 'Connect Four', accent: '#f5c451', tag: 'Drop discs, line up four' },
  { slug: 'checkers', title: 'Checkers', accent: '#e5484d', tag: 'Jump, king, outmaneuver JEV' },
  { slug: 'dots-and-boxes', title: 'Dots & Boxes', accent: '#2dd4bf', tag: 'Close squares, claim boxes' },
  { slug: 'guess-who', title: 'Guess Who', accent: '#fb923c', tag: 'Narrow it down before JEV does' },
  { slug: 'mastermind', title: 'Mastermind', accent: '#a855f7', tag: 'Crack the secret code' },
  { slug: 'minesweeper', title: 'Minesweeper', accent: '#4ade80', tag: 'Clear the field, dodge the mines' },
  { slug: 'sudoku', title: 'Sudoku', accent: '#60a5fa', tag: 'Fill the grid, one digit each' },
  { slug: '2048', title: '2048', accent: '#edc22e', tag: 'Slide, merge, reach 2048' },
];
// Not one of the nine: the hub app's own Activity artwork. Rendered by name (`arcade`), kept out of GAMES so the per-game loops are unchanged.
const ARCADE = { slug: 'arcade', title: 'JevPlay Arcade', accent: '#a99bff', tag: 'Nine games. Pick one, play JEV.', brand: 'JEVPLAY.GAMES', url: 'jevplay.games' };

const svg = (slug, size, extra = '') => `<svg viewBox="0 0 100 100" width="${size}" height="${size}" ${extra}>${MOTIFS[slug]()}</svg>`;
const mark = `<svg viewBox="0 0 64 64" width="34" height="34"><rect width="64" height="64" rx="15" fill="#171a24" stroke="#b3a0ff" stroke-opacity=".35" stroke-width="1.5"/><path d="M34 14v20.5c0 5.2-4.2 9.5-9.5 9.5S15 39.7 15 34.5" fill="none" stroke="#eef0f7" stroke-width="6" stroke-linecap="round"/><path d="M40.3 33v22M47.7 33v22M33 40.3h22M33 47.7h22" stroke="#b3a0ff" stroke-width="1.8" opacity=".55"/></svg>`;
const shell = (inner, accent) => `<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:Inter;src:url("${font}") format("woff2");font-weight:100 900}
  *{box-sizing:border-box;margin:0}
  body{width:1024px;height:576px;overflow:hidden;background:#0e1017;font-family:Inter,sans-serif;color:#eef0f7;position:relative}
  .glow{position:absolute;inset:0;background:radial-gradient(circle at 78% 42%,${accent}33,transparent 55%),radial-gradient(circle at 12% 100%,${accent}18,transparent 45%)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:32px 32px;mask-image:radial-gradient(circle at 70% 50%,#000,transparent 75%)}
</style><body><div class="glow"></div><div class="grid"></div>${inner}</body>`;

const cover = g => shell(`
  <div style="position:absolute;left:64px;top:64px;display:flex;align-items:center;gap:12px;font-weight:700;letter-spacing:.14em;font-size:14px;color:#a3aabd">${mark}${g.brand || 'JEV ARCADE'}</div>
  <div style="position:absolute;left:64px;top:190px;width:470px">
    <div style="font-size:${g.title.length > 11 ? 76 : 92}px;line-height:.98;font-weight:850;letter-spacing:-.03em">${g.title}</div>
    <div style="margin-top:26px;font-size:26px;font-weight:600;color:${g.accent}">${g.tag}</div>
    <div style="margin-top:34px;display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:999px;background:#ffffff10;border:1px solid #ffffff22;font-size:17px;font-weight:600"><span style="width:10px;height:10px;border-radius:50%;background:#6fdcc8"></span>Play against JEV</div>
  </div>
  <div style="position:absolute;right:56px;top:76px;width:424px;height:424px;filter:drop-shadow(0 24px 40px #00000088)">${svg(g.slug, 424)}</div>
  <div style="position:absolute;left:64px;bottom:44px;font-size:14px;color:#78809a;letter-spacing:.06em">${g.url || g.slug + '.jevplay.games'}</div>`, g.accent);

// Background: art hugging the edges, the middle left clear for the game's own UI.
const background = g => shell(`
  <div style="position:absolute;left:-70px;bottom:-80px;width:340px;height:340px;opacity:.5;transform:rotate(-8deg)">${svg(g.slug, 340)}</div>
  <div style="position:absolute;right:-60px;top:-70px;width:320px;height:320px;opacity:.5;transform:rotate(9deg)">${svg(g.slug, 320)}</div>
  <div style="position:absolute;right:120px;bottom:-40px;width:170px;height:170px;opacity:.28;transform:rotate(-14deg)">${svg(g.slug, 170)}</div>
  <div style="position:absolute;left:150px;top:-30px;width:150px;height:150px;opacity:.28;transform:rotate(12deg)">${svg(g.slug, 150)}</div>`, g.accent);

module.exports = { ARCADE, GAMES, MOTIFS, svg, shell, cover, background, mark, font };
if (isMain) (async () => {
  const { chromium } = require(pwDir);
  const outDir = path.resolve(outArg || path.join(__dirname, 'out'));
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
  for (const g of [...GAMES, ARCADE]) {
    for (const [kind, fn] of [['cover', cover], ['background', background]]) {
      const html = path.join(outDir, `.${g.slug}-${kind}.html`);
      fs.writeFileSync(html, fn(g));
      await page.goto(pathToFileURL(html).href);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(outDir, `${g.slug}-${kind}.png`) });
      fs.unlinkSync(html);
    }
    console.log('rendered', g.slug);
  }
  await browser.close();
})();
