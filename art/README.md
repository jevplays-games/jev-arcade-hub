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
