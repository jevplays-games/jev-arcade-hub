# JevPlay Arcade art

One pipeline renders every raster the arcade ships: Discord application icons, Activity
cover, background and preview video, the hub's hero, social cards and card art, and each
game's page-meta icons. The art itself is hand-built SVG in `art/emblems/` and in each
game's `public/art/`. Everything below the art direction is how to run it.

## Art direction: Lacquer and Glow

Every piece in the family is a **chunky lacquered game piece on a dark ground, lit from
the top-left, glowing in its game's accent**. Ten subjects, one hand. If a new drawing
does not follow the rules below it will not sit next to the others.

**Light.** One key light, top-left, slightly above. Highlights sit on top and left edges;
shadows and thickness fall down and to the right. A second, weak rim light comes from the
bottom-right in JEV teal (`#6fdcc8`). Nothing is lit from below or from the right.

**Form.** Subjects are solid, rounded and thick, like moulded lacquer or enamel: round
caps, generous corner radii, no hairlines, no outlines. A form is built from these layers,
bottom to top (see `emblems/tic-tac-toe.svg`, which is the reference):

1. **Bloom**: a blurred copy in the accent, about 40% opacity, behind the subject.
2. **Cast shadow**: a dark blurred copy, offset down-right by about (3%, 4%).
3. **Thickness**: one or two flat copies in the darkest tone of the hue, offset down-right
   by about (1.4%, 2.2%). This is the side of the piece; it is what makes it an object.
4. **Edge**: the full shape in a light-to-deep gradient (the bevel).
5. **Face**: the same shape inset about 10%, in a slightly flatter gradient.
6. **Gloss**: a soft white wash over the top half, clipped to the face, plus one or two
   crisp white streaks along the top-left edges (round caps, 2% wide, 80% opacity).

**Edges.** Defined by the bevel and the thickness, never by a stroke around the shape.

**Depth.** Three planes only: ground, subject, sparks. The subject may be two overlapping
pieces (front one casts its shadow on the back one). Tilt the subject −6° to −10°.

**Ground.** Full-bleed square, no transparency: a radial gradient from the accent's deep
tone (top-left, 28%/20%) to near-black `#0a0b13`, a faint teal rim glow bottom-right, the
game's own board pattern as 5% white lines, film grain (`feTurbulence`, 7% alpha) and a
vignette. Discord crops icons to a circle, so the subject stays inside a centred circle of
radius 46% and nothing important sits in a corner.

**Colour.** Saturated accent on the dark ground. Each gradient runs light tint, pure hue,
deep shade (never to grey or black). At most two hues in the subject, plus white gloss.

**Texture.** Grain on the ground only. Pieces are clean lacquer.

**Sparks.** One four-point star and one or two dots, white, in the emptiest corner zone.

**The J co-sign.** The arcade signs every game emblem with a J badge at the bottom-right,
drawn exactly as in the reference: a `#0a0b13` cut-out circle (r 50 at 398,398 in the 512
box), a `#161927` disc (r 41) with a 3px ring in the game's accent at 70%, and the J stroke
in `#eef0f7`. It reads as a status badge on an avatar, which is native to Discord, and it
shrinks to a harmless dot at 40px. The hub's own emblem is the J itself and carries no
badge. Header marks and favicons (64 box and smaller) carry no badge.

**Silhouette test.** Each emblem must be recognisable at 40px in a circle and distinct
from the other nine by shape alone. `render-icons.cjs` writes `icons-sheet.png` for
exactly this check; look at it.

### Subjects and identity

Canonical accents are the `GAMES` table in `render-art.cjs`. A game uses its trio
everywhere: emblem, Discord art, hub card, `game.css`.

| Game | `--accent` | `--accent-deep` | `--accent-ink` | `--accent-text` | Emblem subject |
| --- | --- | --- | --- | --- | --- |
| tic-tac-toe | `#a99bff` | `#6f5fd6` | `#120c2a` | (accent) | Violet X crossing a teal O |
| connect-four | `#f5c451` | `#c8922a` | `#271c06` | (accent) | Gold disc dropping into a blue frame, a red disc seated beside it |
| checkers | `#e5484d` | `#b02a31` | `#1f0608` | `#f2767a` | A red king: two stacked pucks with a gold crown, on a board corner |
| dots-and-boxes | `#2dd4bf` | `#14a08f` | `#04211d` | (accent) | Four pearl dots, three teal rails and a pink fourth closing a glass box |
| guess-who | `#fb923c` | `#d4691a` | `#2a1203` | (accent) | A standing flip card: a silhouette head with an orange question mark |
| mastermind | `#a855f7` | `#7e30d1` | `#14052a` | `#c084fc` | Four glossy code pegs in a purple tray, one hooded by a keyhole |
| minesweeper | `#4ade80` | `#22a85a` | `#052912` | (accent) | A spiked mine on a green tile with a red flag planted in it |
| sudoku | `#60a5fa` | `#2f74d0` | `#061a33` | (accent) | A 3x3 block of blue tiles, the centre one lifted and lit with a 9 |
| 2048 | `#edc22e` | `#c0961a` | `#2a2003` | (accent) | A gold 2048 tile with two smaller tiles sliding in behind it |
| arcade (hub) | `#a99bff` | `#6f5fd6` | `#120c2a` | (accent) | The J in white lacquer over nine gems, one per game accent |

`--accent-text` is the accent used as text on the dark shell; red and purple are lightened
there to hold 4.5:1.

### In the game UI

The same rules, at lower cost, because this art ships to phones:

- **Pieces** are SVG files in `public/art/`, painted as CSS `background-image` on elements
  the page already sizes (no layout shift, sharp at 1x to 3x). Edge, face, thickness and a
  gloss streak; gradients only, **no filters**. `jev-tic-tac-toe/public/art/x.svg` is the
  reference.
- **Boards** sit in a `.jv-tray`; empty cells are wells (`--well`). Both come from
  `brand.css`, which also carries the lighting tokens (`--light`, `--lip`, `--raise`),
  the result plaque (`.jv-plaque`), the empty state (`.jv-empty`), the motion keyframes
  (`jv-pop`, `jv-drop`, `jv-rise`, `jv-glow`, `jv-breathe`) and the short-frame tiers.
- **End state**: the status line becomes the plaque in place, with the shared medals in
  `brand/result-win.svg`, `result-draw.svg`, `result-loss.svg`. The board stays visible.
- **Motion** is short and physical: a piece pops or drops in (about 350ms, one overshoot),
  a win glows, a result rises. `prefers-reduced-motion` ends all of it.
- Inside SVG files use presentation attributes only: no `<style>`, no `style=""`. The apps
  send `style-src 'self'` and it applies to SVG documents too.
- No `data:` URIs (minesweeper's `img-src` has none), nothing that depends on hover, and a
  non-colour cue wherever colour carries meaning.

## Emblems, icons and page meta

`emblems/<slug>.svg` is the source for a game's identity (512 box, full-bleed).

```sh
node art/render-icons.cjs <playwright-dir> <chromium-exe> [--out dir] [--install gamesRoot] [slug...]
```

- `out/<slug>-icon-1024.png`: the Discord application icon.
- `out/<slug>-og.png`: 1200x630 social card.
- `out/icons-sheet.png`: every emblem at 256, 80 and 40px, square and circle-cropped.
- `--install <gamesRoot>` (the directory holding the ten repos) also writes, into each
  repo's `public/brand/`: `apple-touch-icon.png` (180), `favicon-32.png`, `og.png`, and
  the hub's card art `public/brand/games/<slug>.png`. These are palette-quantised with
  ffmpeg because they ship with the game. Regenerate each repo's integrity manifest
  after installing.
- guess-who is the exception (`LEAN` in the script): its `npm run check` caps everything it
  serves at 150,000 gzip bytes and a PNG does not compress, so its social card is written to
  the hub (`public/brand/og/guess-who.png`, referenced by absolute URL from its `og:image`)
  and its touch icon uses a 40-colour palette. The hub's own card is `arcade-og.png`.

## Review screenshots

```sh
node art/shoot.cjs <playwright-dir> <url> <outDir> --board <selector> [--ready <js>] [--scenario file.cjs] [--engines chromium,webkit,firefox]
```

Shoots the visible viewport (not the full page) at 320x568, 360x800, 390x844, 844x390,
768x1024, 1280x720, 1920x1080, 2560x1440 and two Discord picture-in-picture frames
(480x270, 320x180), in Chromium, WebKit and Firefox. It fails a screen that scrolls
sideways or clips the board, lists touch targets under 44px, and writes one contact sheet
per engine. Output goes to `art/review/`, which is not committed. Passing checks do not
show that the art is good: open the images.

Run the app without its model key for this (invoke the entry point directly, not through
`npm start`), on a scratch database, with the per-hour rate limits raised: every viewport
is a fresh session.

## Activity artwork

- `out/<slug>-cover.png` 1024x576, title and art (Activities > Art Assets > Cover Art)
- `out/<slug>-background.png` 1024x576, art at the edges, clear middle (Background)
- `out/<slug>-preview.mp4` 640x360, 10 s, H.264 (Video Preview; Discord's cap is 0.5 MB)

Regenerate (needs Playwright's Chromium, and ffmpeg on PATH for the video):

```sh
node art/render-art.cjs   <playwright-dir> <chromium-exe> art/out
node art/render-video.cjs <playwright-dir> <chromium-exe> art/out [slug...]
```

Edit `GAMES` in `render-art.cjs` to change a title, tagline or accent colour.
Do not include `art/` in the GoDaddy zip; the hub does not serve it.

## Web landing artwork

`render-landing.cjs` reuses the exports of `render-art.cjs`. No runtime dependencies or
network requests are added.

```sh
node art/render-landing.cjs <playwright-dir> <chromium-exe> [outDir]
node art/render-landing.cjs "C:/Users/timot/AppData/Local/Temp/pw" "C:/Users/timot/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
```

The Playwright argument accepts a module directory or an installation directory
containing `node_modules/playwright-core`. The default output is `public/brand`:

- `arcade-hero.png`: 1600×900, desktop landing hero.
- `arcade-og.png`: 1200×630, social sharing card and compact mobile hero.
- `arcade-icon-1024.png`: 1024×1024.

Regenerate and inspect all three images after changing the art. Include the
generated `public/brand` assets with the normal site upload.
