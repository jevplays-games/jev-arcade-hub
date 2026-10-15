# Discord upload checklist

Ten Discord applications, four assets each. **Nothing here is uploaded by the pipeline**: the scripts only write
files to `art/out/`. Every upload is a manual step in the Discord Developer Portal
(`https://discord.com/developers/applications/<Application ID>`), signed in to the jevplay.games team.

## Pre-flight

1. Regenerate everything from the emblems (all ten `art/emblems/<slug>.svg` must exist):

   ```sh
   node art/render-icons.cjs <playwright-dir> <chromium-exe>             # out/<slug>-icon-1024.png, icons-sheet.png
   node art/render-art.cjs   <playwright-dir> <chromium-exe> art/out     # out/<slug>-cover.png, -background.png
   node art/render-video.cjs <playwright-dir> <chromium-exe> art/out     # out/<slug>-preview.mp4 (ten, hub included)
   ```

   `npm test` fails if any of the ten emblems is missing; `node art/verify-game-art.cjs` checks the copied game art.
   Render the hub landing assets into `public/brand/` after the icons:

   ```sh
   node art/render-landing.cjs <playwright-dir> <chromium-exe>
   ```

2. Open `art/out/icons-sheet.png`. Every emblem must be recognisable at 40 px in a circle and distinct from the other nine.
3. Check the files: covers and backgrounds are 1024x576 PNG, previews are 640x360 H.264 MP4 and each under 0.5 MB
   (`ls -l art/out/*-preview.mp4`; the last render was 143-188 KB), icons are 1024x1024 PNG.
4. Open at least the cover and video of the app you are about to upload, not just the icon.

## What each field takes

Only the limits the repo documents (`art/README.md`) are stated as fact. Anything else is marked **unverified**:
read the portal's own helper text on the day and trust it over this file.

| Portal page > field | File | Format, size | Source of the limit |
| --- | --- | --- | --- |
| General Information > App Icon | `out/<slug>-icon-1024.png` | 1024x1024 PNG | size from `art/README.md`; byte cap **unverified** |
| Activities > Art Assets > Cover Art | `out/<slug>-cover.png` | 1024x576 PNG | `art/README.md`; byte cap **unverified** |
| Activities > Art Assets > Background | `out/<slug>-background.png` | 1024x576 PNG | `art/README.md`; byte cap **unverified** |
| Activities > Art Assets > Video Preview | `out/<slug>-preview.mp4` | 640x360 H.264 MP4, 10 s, **at most 0.5 MB** | `art/README.md` (Discord's cap is 0.5 MB) |

The portal's page and field names move around; if a label differs, find the nearest equivalent and note it here.

## How to verify any upload

After each upload, **Save Changes**, then (Discord caches images, so a hard refresh or a second client may be needed):

- **Portal preview**: the field shows the new image, not the old flat "J" tile.
- **App launcher / Activities shelf**: in a server where the app is installed, open the Activities (rocket) launcher.
  The app's tile shows the cover art, the entry is titled correctly, and the preview video plays and loops.
- **Bot profile**: open the bot's profile card (member list or a slash-command reply). The avatar shows the new icon.
- **Small, circle-cropped**: look at the icon at about 40 px and 24 px in a circle (member list, message avatar, the
  command picker). The emblem's subject is still readable.
- **Inside the Activity**: launch it once; the background should sit behind the game UI with the middle clear.
  (Only Tic-Tac-Typed, formerly Tic-Tac-Toe, is verified as launching inside Discord; see `DISCORD.md`.)

## Apps

For each app tick every box, then sign off the verification line. Application IDs are from `DISCORD.md`; they do not
change with the renames. Also set each app's display name to the new name in the heading (General Information > Name).

### jevplay.games (hub) - ID 1554746719227613214 - slug `hub`

- [ ] General Information > App Icon: `art/out/hub-icon-1024.png` (the hub emblem; also `public/brand/icon-1024.png`)
- [ ] Activities > Art Assets > Cover Art: `art/out/hub-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/hub-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/hub-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Tic-Tac-Typed - ID 1552421200100065280 - slug `tic-tac-typed`

- [ ] General Information > App Icon: `art/out/tic-tac-typed-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/tic-tac-typed-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/tic-tac-typed-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/tic-tac-typed-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Choice Four - ID 1552421867057315940 - slug `choice-four`

- [ ] General Information > App Icon: `art/out/choice-four-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/choice-four-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/choice-four-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/choice-four-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Typecheckers - ID 1552421947541950514 - slug `typecheckers`

- [ ] General Information > App Icon: `art/out/typecheckers-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/typecheckers-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/typecheckers-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/typecheckers-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Box Score - ID 1552421783792128140 - slug `box-score`

- [ ] General Information > App Icon: `art/out/box-score-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/box-score-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/box-score-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/box-score-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Noul Who - ID 1552421506703687741 - slug `noul-who`

- [ ] General Information > App Icon: `art/out/noul-who-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/noul-who-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/noul-who-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/noul-who-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Typecrack - ID 1552421410775765052 - slug `typecrack`

- [ ] General Information > App Icon: `art/out/typecrack-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/typecrack-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/typecrack-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/typecrack-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### SafeSweep - ID 1552421309139521628 - slug `safesweep`

- [ ] General Information > App Icon: `art/out/safesweep-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/safesweep-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/safesweep-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/safesweep-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Typedoku - ID 1552422232234397726 - slug `typedoku`

- [ ] General Information > App Icon: `art/out/typedoku-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/typedoku-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/typedoku-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/typedoku-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Slide Score - ID 1552422046762278912 - slug `slide-score`

- [ ] General Information > App Icon: `art/out/slide-score-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/slide-score-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/slide-score-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/slide-score-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop
