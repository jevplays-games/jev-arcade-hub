// Renders Discord icons and a contact sheet; approved game OG cards are never written here.
// usage: node art/render-icons.cjs <playwright-dir> <chromium-exe> [--out dir] [slug...]
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { BRAND, GAMES, ORDER } = require('./brand.cjs');

// slug -> repo directory under the games root (the git root is the inner directory).
// New repo first, pre-rename fallback second.
const REPOS = {
  'tic-tac-typed': ['jev-tic-tac-typed/jev-tic-tac-typed', 'jev-tic-tac-toe/jev-tic-tac-toe'],
  'choice-four': ['jev-choice-four/jev-choice-four', 'jev-connect-four/jev-connect-four'],
  typecheckers: ['jev-typecheckers/jev-typecheckers', 'jev-checkers-analytics/jev-checkers-analytics'],
  'box-score': ['jev-box-score/jev-box-score', 'jev-dots-and-boxes/jev-dots-and-boxes'],
  'noul-who': ['jev-noul-who/jev-noul-who', 'jev-guess-who/jev-guess-who'],
  typecrack: ['jev-typecrack/jev-typecrack', 'jev-mastermind/jev-mastermind'],
  safesweep: ['jev-safesweep/jev-safesweep', 'jev-minesweeper/jev-minesweeper'],
  typedoku: ['jev-typedoku/jev-typedoku', 'jev-sudoku-analytics/jev-sudoku'],
  'slide-score': ['jev-slide-score/jev-slide-score', 'jev-2048-arcade/jev-2048-arcade'],
  hub: ['JevPlay-Games', 'jev-arcade-hub'],
};
const repoDir = (root, slug) => {
  const dirs = REPOS[slug].map(d => path.join(path.resolve(root), d));
  return dirs.find(d => fs.existsSync(d)) || dirs[0];
};
const LEAN = new Set(['noul-who']);
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

const page1 = (file, size) => `<!doctype html><meta charset="utf-8"><style>*{margin:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:#0e1017}img{display:block;width:${size}px;height:${size}px}</style><img src="${pathToFileURL(file).href}">`;

function sheet(slugs) {
  const cell = s => {
    const src = pathToFileURL(emblem(s)).href;
    return `<div class="c"><img class="a" src="${src}"><div class="r"><img class="b" src="${src}"><img class="d" src="${src}"><img class="e" src="${src}"></div><span>${[...GAMES, BRAND].find(g => g.slug === s).name}</span></div>`;
  };
  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box}body{width:1500px;background:#313338;font:600 14px system-ui,sans-serif;color:#dbdee1;padding:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:30px 20px}
    .c{display:flex;flex-direction:column;align-items:center;gap:12px}.r{display:flex;align-items:center;gap:14px}
    .a{width:256px;height:256px;border-radius:56px}.b{width:80px;height:80px;border-radius:50%}.d{width:40px;height:40px;border-radius:50%}.e{width:40px;height:40px;border-radius:10px}
  </style>${slugs.map(cell).join('')}`;
}

async function main() {
  const opts = parse(process.argv.slice(2));
  if (!opts.pwDir || !opts.exe) throw new Error('usage: node art/render-icons.cjs <playwright-dir> <chromium-exe> [--out dir] [slug...]');
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
      console.log('rendered', slug);
    }
    await shot(sheet(have), 1500, 800, path.join(outDir, 'icons-sheet.png'));
    console.log('rendered icons-sheet', have.length, 'emblems');
  } finally {
    await browser.close();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
