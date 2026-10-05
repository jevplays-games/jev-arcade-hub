# Activity artwork

Cover art, background and 10-second preview video for the nine games' Discord Activities.
The images are generated (no stock art): one distinct board motif per game in the arcade's colours.

- `out/<slug>-cover.png` 1024x576, title and board (Activities > Art Assets > Cover Art)
- `out/<slug>-background.png` 1024x576, art at the edges, clear middle (Background)
- `out/<slug>-preview.mp4` 640x360, 10 s, H.264, about 50 KB (Video Preview; Discord's cap is 0.5 MB)

Regenerate (needs Playwright's Chromium, and ffmpeg on PATH for the video):

```sh
node art/render-art.cjs   <playwright-dir> <chromium-exe> art/out
node art/render-video.cjs <playwright-dir> <chromium-exe> art/out [slug...]
```

Edit `GAMES` and `MOTIFS` in `render-art.cjs` to change a title, tagline, accent colour or board.
Do not include `art/` in the GoDaddy zip; the hub does not serve it.

## Web landing artwork

`render-landing.cjs` reuses the exported `MOTIFS`, `GAMES`, `ARCADE`, `shell`
(including the local Inter font), and rounded J# `mark` from `render-art.cjs`.
Tiles have solid fills with accent edge shadows; the glow and faint grid belong
to the background. No runtime dependencies or network requests are added.

```sh
node art/render-landing.cjs <playwright-dir> <chromium-exe> [outDir]
node art/render-landing.cjs "C:/Users/timot/AppData/Local/Temp/pw" "C:/Users/timot/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
```

The Playwright argument accepts a module directory or an installation directory
containing `node_modules/playwright-core`. The default output is `public/brand`:

- `arcade-hero.png`: 1600×900, desktop landing hero.
- `arcade-og.png`: 1200×630, social sharing card and compact mobile hero.
- `arcade-icon-1024.png`: 1024×1024, centred mark with background glow.

The page uses the hero with accessible title, description and image alt text;
Open Graph and Twitter metadata reference the absolute social-card URL.
Regenerate and inspect all three images after changing the art. Include the
generated `public/brand` assets with the normal site upload.
