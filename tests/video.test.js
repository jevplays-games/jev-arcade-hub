import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import video from '../art/render-video.cjs';
import brand from '../art/brand.cjs';

test('video scenes preserve the approved mascot and local fonts without effects', () => {
  const robot = fs.readFileSync(new URL('../art/src/jev-robot.svg', import.meta.url), 'utf8').trim();
  for (const g of [...brand.GAMES, brand.BRAND]) {
    const html = video.scene(g);
    assert.ok(html.includes(robot));
    assert.match(html, /file:[^"\n]+inter-var\.woff2/);
    assert.match(html, /file:[^"\n]+vt323\.woff2/);
    assert.doesNotMatch(html, /gradient\(|filter:|@keyframes (rise|tileIn|breathe|bob|shine|glow)\b/);
    assert.equal((html.match(/class="letter"/g) || []).length, Array.from(g.tagline).length);
    assert.match(html, /animation-delay:5\.0000s/);
    for (const hex of html.match(/#[0-9a-f]{6,8}\b/gi) || []) {
      assert.ok(['#F386A1', '#1E1E1E', '#E551BA', '#DEDEDE', '#FEFEFE', '#1F78A8', '#E8A33D'].includes(hex), hex);
    }
  }
});

test('encoder retries oversized files and retains the capture settings without invoking ffmpeg', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-video-'));
  try {
    const mp4 = path.join(dir, 'hub-preview.mp4');
    const calls = [];
    video.encode('capture.webm', mp4, .45, 24, (command, args) => {
      assert.equal(command, 'ffmpeg');
      calls.push(args);
      fs.writeFileSync(mp4, Buffer.alloc(calls.length === 1 ? 500001 : 500000));
    });
    assert.deepEqual(calls.map(args => args[args.indexOf('-crf') + 1]), ['24', '26']);
    for (const args of calls) {
      for (const value of ['10', 'fps=24,scale=640:360', 'libx264', 'yuv420p', '+faststart']) assert.ok(args.includes(value));
    }
    assert.throws(() => video.encode('capture.webm', mp4, 0, 51, () => fs.writeFileSync(mp4, Buffer.alloc(500001))), /exceeds/);
    assert.ok(!fs.existsSync(mp4));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('cleanup keeps catalog previews and other artwork only', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-video-'));
  try {
    for (const name of ['hub-preview.mp4', 'noul-who-preview.mp4', 'obsolete.mp4', 'hub-cover.png']) fs.writeFileSync(path.join(dir, name), '');
    video.cleanOutputs(dir);
    assert.deepEqual(fs.readdirSync(dir).sort(), ['hub-cover.png', 'hub-preview.mp4', 'noul-who-preview.mp4']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
