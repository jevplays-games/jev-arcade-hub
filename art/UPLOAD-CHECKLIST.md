# Discord upload checklist

Ten Discord applications, four assets each. **Nothing here is uploaded by the pipeline**: the scripts only write
files to `art/out/`. Every upload is a manual step in the Discord Developer Portal
(`https://discord.com/developers/applications/<Application ID>`), signed in to the JevPlay.Games team.

## Pre-flight

1. Regenerate everything from the emblems (all ten `art/emblems/<slug>.svg` must exist):

   ```sh
   node art/render-icons.cjs <playwright-dir> <chromium-exe>             # out/<slug>-icon-1024.png, -og.png, icons-sheet.png
   node art/render-art.cjs   <playwright-dir> <chromium-exe> art/out     # out/<slug>-cover.png, -background.png
   node art/render-video.cjs <playwright-dir> <chromium-exe> art/out     # out/<slug>-preview.mp4 (ten, hub included)
   ```

   The renderer prints `(MOTIFS fallback)` next to any slug whose emblem file is missing; there should be none.
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
  command picker). The emblem's subject is still readable, and the J badge shrinks to a dot rather than clutter.
- **Inside the Activity**: launch it once; the background should sit behind the game UI with the middle clear.
  (Only Tic-Tac-Toe is verified as launching inside Discord; see `DISCORD.md`.)

## Apps

For each app tick every box, then sign off the verification line. Application IDs are from `DISCORD.md`.

### JevPlay Arcade (hub) - ID 1554746719227613214 - slug `arcade`

- [ ] General Information > App Icon: `art/out/arcade-icon-1024.png` (the arcade emblem: the J over nine gems)
- [ ] Activities > Art Assets > Cover Art: `art/out/arcade-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/arcade-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/arcade-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Tic-Tac-Toe - ID 1552421200100065280 - slug `tic-tac-toe`

- [ ] General Information > App Icon: `art/out/tic-tac-toe-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/tic-tac-toe-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/tic-tac-toe-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/tic-tac-toe-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Connect 4 - ID 1552421867057315940 - slug `connect-four`

- [ ] General Information > App Icon: `art/out/connect-four-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/connect-four-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/connect-four-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/connect-four-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Checkers - ID 1552421947541950514 - slug `checkers`

- [ ] General Information > App Icon: `art/out/checkers-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/checkers-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/checkers-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/checkers-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Dots & Boxes - ID 1552421783792128140 - slug `dots-and-boxes`

- [ ] General Information > App Icon: `art/out/dots-and-boxes-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/dots-and-boxes-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/dots-and-boxes-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/dots-and-boxes-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Guess Who - ID 1552421506703687741 - slug `guess-who`

- [ ] General Information > App Icon: `art/out/guess-who-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/guess-who-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/guess-who-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/guess-who-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Mastermind - ID 1552421410775765052 - slug `mastermind`

- [ ] General Information > App Icon: `art/out/mastermind-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/mastermind-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/mastermind-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/mastermind-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Minesweeper - ID 1552421309139521628 - slug `minesweeper`

- [ ] General Information > App Icon: `art/out/minesweeper-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/minesweeper-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/minesweeper-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/minesweeper-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### Sudoku - ID 1552422232234397726 - slug `sudoku`

- [ ] General Information > App Icon: `art/out/sudoku-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/sudoku-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/sudoku-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/sudoku-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop

### 2048 - ID 1552422046762278912 - slug `2048`

- [ ] General Information > App Icon: `art/out/2048-icon-1024.png`
- [ ] Activities > Art Assets > Cover Art: `art/out/2048-cover.png`
- [ ] Activities > Art Assets > Background: `art/out/2048-background.png`
- [ ] Activities > Art Assets > Video Preview: `art/out/2048-preview.mp4`
- [ ] Verified: launcher tile, bot profile, Activities shelf, 40 px circle crop
