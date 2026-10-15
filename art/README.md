# jevplay.games art

One pipeline renders the hub's art and every Discord asset for the nine games and the hub: application
icons, Activity cover, background and preview video, the hub's hero, social card, icons and card art. The
games' own page meta (`icon.svg`, favicon, touch icon, `og.png`) is drawn and owned by each game's repo; the
hub reuses it and never writes into a game repo.

## Style

Pink/ink pixel windows, the same system as `public/brand/brand.css`:

- **Palette, exact hexes only.** Pink `#F386A1` ground, ink `#1E1E1E` for text, borders, title bars and
  shadows, grey `#DEDEDE` window bodies and chips, paper `#FEFEFE` bevels and inverted text, magenta
  `#E551BA` for one highlight per image (in hub chrome; game drawings keep their own). Blue `#1F78A8` and
  amber `#E8A33D` are for charts only.
- **Shapes.** Flat retro OS windows: grey body, 2px paper inner bevel, 1px ink border, hard ink drop shadow
  (no blur), ink title bar with the UPPERCASE name and `_ x`. Pink ground with a 1px ink inset frame, four
  L-shaped crop marks and one or two hard-clipped halftone blobs (6px dot pitch).
- **Type.** Inter 700 for titles (tracking about −0.05em), VT323 for UI and pixel text. Both are the local
  files in `public/brand/`; nothing is fetched.
- **Never.** Gradients (other than the halftone dots), glow, gloss, blur, filters, photos, 3D, the TypeSafe
  logo mark, Hasbro or Invicta trade dress, the domain misspelt with an extra "s", old game names or "Arcade".
- **Colour per game** only where gameplay needs it, never in chrome, badges or banners (owner decision).

**Jev** is always the canonical robot `art/src/jev-robot.svg` (orchestrator decision D15: the org banner's
SVG, byte for byte, pink face). Scale it with width/height; never redraw or recolour it. `tests/art.test.js`
pins its sha256.

## Sources

| Path | What it is |
|---|---|
| `src/game-icons/<slug>.svg` | Each game's approved `public/brand/icon.svg`, copied unchanged. The drawing every hub asset uses for that game. |
| `out/<slug>-og.png` | Each game's approved social card, copied unchanged (Noul Who: its `dist-hub/noul-who.png`, also served at `public/brand/og/noul-who.png`). |
| `src/game-art-sources.json` | Repo, branch, commit and sha256 for each copied file. `node art/verify-game-art.cjs` checks them. |
| `src/jev-robot.svg` | The canonical robot (D15). |
| `emblems/<slug>.svg` | The ten 512px emblems: the game's drawing on a pink halftone ground inside the 46% circle Discord crops to; `hub.svg` is Jev in a JEVPLAY.GAMES window. Presentation attributes only. |
| `brand.cjs` | `BRAND` and the game list, read from `games.json` (names, slugs, taglines). The hub's art slug is `hub`. |

If a game re-renders its icon or card, copy the new file in, update its entry in `game-art-sources.json`
and re-render. Do not redraw a game's art here.

## Rendering

Every script takes a Playwright module directory and a Chromium executable:

```sh
node art/render-icons.cjs   <playwright-dir> <chromium-exe>   # out/<slug>-icon-1024.png, out/icons-sheet.png, public/brand/games/<slug>.png
node art/render-art.cjs     <playwright-dir> <chromium-exe>   # out/<slug>-cover.png, out/<slug>-background.png (1024x576)
node art/render-video.cjs   <playwright-dir> <chromium-exe>   # out/<slug>-preview.mp4 (640x360, 10 s, <= 0.5 MB; needs ffmpeg)
node art/render-landing.cjs <playwright-dir> <chromium-exe>   # public/brand/{hero,og,favicon-32,apple-touch-icon}.png, icon.svg, mark.svg
node assets/src/render.cjs  <playwright-dir> <chromium-exe>   # assets/banner.png (2560x840), assets/social-preview.png (1280x640)
node art/verify-game-art.cjs                                  # copied game art still matches its recorded hash
```

Run `render-icons.cjs` before `render-landing.cjs`: `public/brand/icon-1024.png` is a copy of
`out/hub-icon-1024.png`. The 32 and 180px icons are point-sampled from a 16x render and snapped to
`icon.svg`'s own hexes, so they are pixel-exact.

## Checks before uploading

- `out/icons-sheet.png`: every emblem at 256, 80 and 40px, square and inside an inked circle crop. Each must
  be recognisable at 40px in the circle and distinct from the other nine.
- Sizes: icons 1024, covers and backgrounds 1024×576, card art 320, hero 1600×900, OG 1200×630, sheet
  1500×848, banner 2560×840, social 1280×640, favicon 32, touch icon 180; previews 640×360, 10 s, ≤ 0.5 MB.
- `npm test` runs `tests/art.test.js`: the emblem rules, palette, the robot hash and the copied-art hashes.

Uploads to Discord are manual: `art/UPLOAD-CHECKLIST.md`.
