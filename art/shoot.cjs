// Review screenshots for one running app, across the arcade's viewport list and all three engines.
// Every screen must fit: no horizontal scroll, the whole board visible without scrolling, 44px touch targets.
// usage: node art/shoot.cjs <playwright-dir> <url> <outDir> [options]
//   --engines chromium,webkit,firefox   default: all three
//   --board <selector>                  the board element; its box must sit inside the viewport
//   --ready <js expression>             waited for before the first screenshot
//   --scenario <file.cjs>               module.exports = { states: { name: async (page, vp) => {} } }
//                                       each state starts from a fresh page; without it one state, "start"
//   --only <viewport,...>               subset of viewport names
//   --firefox-states <name,...>         Firefox runs only these states (default: the first)
// Writes <engine>-<viewport>-<state>.png (the visible viewport, not the full page), sheet-<engine>.png
// (a contact sheet with the failures flagged) and report.json. Exit code 1 if any check fails.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, touch: true },
  { name: '360x800', width: 360, height: 800, touch: true },
  { name: '390x844', width: 390, height: 844, touch: true },
  { name: '844x390', width: 844, height: 390, touch: true },
  { name: '768x1024', width: 768, height: 1024, touch: true },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '2560x1440', width: 2560, height: 1440 },
  // Discord picture-in-picture: a popped-out Activity frame the page does not control.
  { name: 'pip-480x270', width: 480, height: 270 },
  { name: 'pip-320x180', width: 320, height: 180 },
];

function parse(argv) {
  const [pwDir, url, outDir, ...rest] = argv;
  const o = { pwDir, url, outDir, engines: ['chromium', 'webkit', 'firefox'], board: null, ready: null, scenario: null, only: null, firefoxStates: null };
  for (let i = 0; i < rest.length; i++) {
    const v = () => rest[++i];
    if (rest[i] === '--engines') o.engines = v().split(',');
    else if (rest[i] === '--board') o.board = v();
    else if (rest[i] === '--ready') o.ready = v();
    else if (rest[i] === '--scenario') o.scenario = v();
    else if (rest[i] === '--only') o.only = v().split(',');
    else if (rest[i] === '--firefox-states') o.firefoxStates = v().split(',');
    else throw new Error(`unknown option ${rest[i]}`);
  }
  return o;
}

// Runs in the page. Layout facts only; whether the art is any good is for a person looking at the image.
function audit(boardSelector) {
  const vw = window.innerWidth, vh = window.innerHeight, out = { overflowX: document.documentElement.scrollWidth > vw + 1, scrollWidth: document.documentElement.scrollWidth };
  if (boardSelector) {
    const el = document.querySelector(boardSelector);
    if (!el) out.board = 'missing';
    // A state on another view (analytics, records) hides the board on purpose; a board collapsed to nothing is still a failure.
    else if (el.closest('[hidden]')) out.board = 'hidden';
    else {
      const r = el.getBoundingClientRect();
      out.board = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
      out.boardFits = r.width > 0 && r.left >= -1 && r.top >= -1 && r.right <= vw + 1 && r.bottom <= vh + 1;
    }
  }
  const small = [];
  for (const el of document.querySelectorAll('button,a[href],select,input,summary,[role=button],[tabindex]:not([tabindex="-1"])')) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || cs.pointerEvents === 'none' || el.disabled) continue;
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    // A checkbox or radio is hit through its label; a link inside a sentence is exempt (WCAG 2.5.8 inline).
    if (el.matches('input[type=checkbox],input[type=radio],input[type=range]') && el.closest('label')) continue;
    if (el.matches('a') && cs.display === 'inline') continue;
    if (r.width < 43.5 || r.height < 43.5) small.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].join('.') : ''} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  out.smallTargets = [...new Set(small)].slice(0, 12);
  out.smallTargetCount = small.length;
  return out;
}

async function main() {
  const o = parse(process.argv.slice(2));
  if (!o.pwDir || !o.url || !o.outDir) throw new Error('usage: node art/shoot.cjs <playwright-dir> <url> <outDir> [--engines a,b] [--board sel] [--ready js] [--scenario file.cjs] [--only vp,...]');
  const moduleDir = fs.existsSync(path.join(o.pwDir, 'node_modules', 'playwright-core')) ? path.join(o.pwDir, 'node_modules', 'playwright-core') : o.pwDir;
  const pw = require(path.resolve(moduleDir));
  const outDir = path.resolve(o.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const states = o.scenario ? require(path.resolve(o.scenario)).states : { start: async () => {} };
  const viewports = VIEWPORTS.filter(v => !o.only || o.only.includes(v.name));
  const ready = o.ready ? new Function(`return (${o.ready})`) : null;
  const report = [];
  for (const engine of o.engines) {
    const browser = await pw[engine].launch();
    const names = Object.keys(states).filter((s, i) => engine !== 'firefox' || (o.firefoxStates ? o.firefoxStates.includes(s) : i === 0));
    for (const vp of viewports) for (const state of names) {
      // Firefox has no mobile emulation; it still gets the viewport and touch.
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, hasTouch: Boolean(vp.touch), reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      const entry = { engine, viewport: vp.name, state, errors: [] };
      page.on('pageerror', e => entry.errors.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') entry.errors.push(m.text()); });
      try {
        await page.goto(o.url, { waitUntil: 'load' });
        // Polled from Node with a function, never a string: the apps' CSP has no 'unsafe-eval', and WebKit and
        // Firefox enforce it against Playwright's string evaluation. Scenarios must pass functions too.
        if (ready) for (const until = Date.now() + 15000; !(await page.evaluate(ready)); ) {
          if (Date.now() > until) throw new Error(`not ready: ${o.ready}`);
          await page.waitForTimeout(100);
        }
        await states[state](page, vp);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        await page.evaluate(() => window.scrollTo(0, 0));
        Object.assign(entry, await page.evaluate(audit, o.board));
        entry.file = `${engine}-${vp.name}-${state}.png`;
        // Errors are counted up to here. Playwright's WebKit injects a <style> to take the screenshot, which the
        // apps' style-src 'self' correctly refuses; that message is the tool's, not the page's.
        const seen = entry.errors.length;
        await page.screenshot({ path: path.join(outDir, entry.file), caret: 'initial' });
        entry.errors.length = seen;
      } catch (error) { entry.failed = String(error).split('\n')[0]; }
      entry.ok = !entry.failed && !entry.overflowX && entry.boardFits !== false && entry.board !== 'missing';
      report.push(entry);
      console.log(`${entry.ok ? 'ok  ' : 'FAIL'} ${engine.padEnd(8)} ${vp.name.padEnd(12)} ${state.padEnd(8)}${entry.failed ? ' ' + entry.failed : ''}${entry.overflowX ? ` overflow-x(${entry.scrollWidth})` : ''}${entry.boardFits === false ? ` board-clipped ${JSON.stringify(entry.board)}` : ''}${entry.smallTargetCount ? ` small-targets:${entry.smallTargetCount}` : ''}${entry.errors.length ? ` errors:${entry.errors.length}` : ''}`);
      await context.close();
    }
    await browser.close();
  }
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');

  // Contact sheets: one per engine, every viewport and state at a glance.
  const chromium = await pw.chromium.launch();
  for (const engine of o.engines) {
    const rows = report.filter(r => r.engine === engine && r.file);
    if (!rows.length) continue;
    const html = `<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{width:2400px;background:#313338;color:#dbdee1;font:600 15px system-ui,sans-serif;padding:20px;display:flex;flex-wrap:wrap;gap:22px;align-items:flex-start}
      figure{display:flex;flex-direction:column;gap:6px}img{display:block;height:auto;border:2px solid #4e5058}figure.bad img{border-color:#f23f43}figcaption b{color:#f23f43}</style>` +
      rows.map(r => { const [w] = r.viewport.replace('pip-', '').split('x').map(Number); const shown = Math.min(w, w > 1000 ? 760 : w > 500 ? 520 : 340); return `<figure class="${r.ok ? '' : 'bad'}"><img src="${pathToFileURL(path.join(outDir, r.file)).href}" width="${shown}"><figcaption>${r.viewport} ${r.state}${r.ok ? '' : ' <b>FAIL</b>'}${r.smallTargetCount ? ` · ${r.smallTargetCount} small` : ''}</figcaption></figure>`; }).join('');
    const tmp = path.join(outDir, '.sheet.html');
    fs.writeFileSync(tmp, html);
    const page = await chromium.newPage({ viewport: { width: 2400, height: 1200 } });
    await page.goto(pathToFileURL(tmp).href);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
    await page.screenshot({ path: path.join(outDir, `sheet-${engine}.png`), fullPage: true });
    await page.close();
    fs.unlinkSync(tmp);
  }
  await chromium.close();
  const bad = report.filter(r => !r.ok);
  console.log(`${report.length - bad.length}/${report.length} passed. Open the sheets and the images: passing checks do not show that the art is good.`);
  if (bad.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
