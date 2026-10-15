#!/usr/bin/env node
'use strict';

// Usage: node assets/src/render.cjs <playwright-dir> <chromium-exe>
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const [playwrightDir, chromiumExe, ...extra] = process.argv.slice(2);
  if (!playwrightDir || !chromiumExe || extra.length) {
    throw new Error('Usage: node assets/src/render.cjs <playwright-dir> <chromium-exe>');
  }
  const { chromium } = require(path.resolve(playwrightDir));
  const browser = await chromium.launch({ executablePath: path.resolve(chromiumExe), headless: true });
  try {
    for (const [source, height, scale, output] of [
      ['banner.html', 420, 2, 'banner.png'],
      ['social.html', 640, 1, 'social-preview.png'],
    ]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height }, deviceScaleFactor: scale,
      });
      try {
        const page = await context.newPage();
        await page.goto(pathToFileURL(path.join(__dirname, source)).href, { waitUntil: 'load' });
        await page.evaluate(async () => {
          await Promise.all([document.fonts.load('700 92px Inter'), document.fonts.load('22px VT323')]);
          await document.fonts.ready;
          await Promise.all([...document.images].map(img => img.decode()));
          if (!document.fonts.check('700 92px Inter') || !document.fonts.check('22px VT323')) {
            throw new Error('Local fonts failed to load');
          }
          const frame = document.querySelector('.frame').getBoundingClientRect();
          for (const element of document.querySelectorAll('.copy, .copy *, .window, .window *, .footer')) {
            const box = element.getBoundingClientRect();
            if (box.left < frame.left || box.right > frame.right || box.top < frame.top || box.bottom > frame.bottom) {
              throw new Error(`Content exceeds inset frame: ${element.className || element.tagName}`);
            }
          }
        });
        const target = path.resolve(__dirname, '..', output);
        await page.screenshot({ path: target, fullPage: false, scale: 'device' });
        console.log(`${target} (${1280 * scale}x${height * scale})`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
