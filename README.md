# Gully Chase · Maal Has Opinions

**Small streets. Big chase.** A complete, cheerful chor-police browser game for the theme **“Using technology to find joy.”** Steal three treasures, escape a cop, and convince your talking samosa to keep quiet.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import **Pt-KiteretsuShastri/chorpolice**.
2. Leave **Root Directory** at the repository root (`.`).
3. Deploy. The checked-in `vercel.json` selects **Other** as the framework, skips installation and building, and serves **dist**.

No environment variables, API keys, database, or paid services are needed. Do not run `npm start` as a Vercel build command: that command is only a local development server.

If you set overrides in the Vercel dashboard, use these values:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Root Directory | `.` (repository root) |
| Build Command | Empty / skipped |
| Install Command | Empty / skipped |
| Output Directory | `dist` |

Vercel documentation: https://vercel.com/docs/project-configuration/vercel-json

## Run locally

No dependencies, package installation, build step, API keys, or backend are required.

```bash
git clone https://github.com/Pt-KiteretsuShastri/chorpolice.git
cd chorpolice
python3 -m http.server 8080 --directory dist
```

Open **http://localhost:8080**. Use a local HTTP server rather than opening the HTML as a `file://` URL, because the game uses JavaScript modules. With Node.js and npm installed, `npm start` runs the same Python server.

## Rules

- **Chor:** collect and bank all three treasures at the green safehouse before two minutes expire.
- **Cop:** tag the chor three times, or keep at least one treasure unbanked until time expires.
- Carry one treasure at a time. Getting tagged returns carried loot to its original location; banked loot stays safe.
- Each treasure talks. Noise attracts the police. Hush costs 25 energy and lasts five seconds.
- The trophy is heavy and slows its carrier. Bushes hide a quiet chor from distant cops.
- Chai cups restore sprint energy and respawn after 16 seconds.
- Solo play supports either role. The opponent uses grid pathfinding and respects the same walls.
- Two-player mode is **local, on one keyboard**. It has no online matchmaking.

## Controls

| Action | Solo chor / Player 1 | Solo cop | Player 2 cop |
| --- | --- | --- | --- |
| Move | WASD (arrows also work in solo) | WASD or arrows | Arrow keys |
| Sprint | Shift | Shift | `/` |
| Grab / bank | E | — | — |
| Drop loot | Q | — | — |
| Hush loot | F | — | — |
| Throw net | — | Space | Enter |
| Pause / resume | Esc or P | Esc or P | Esc or P |

Tagging happens on contact. Nets have a five-second cooldown, require clear line of sight, and reach approximately 2.5 tiles. Touch buttons support solo play on phones/tablets. Fullscreen is available where supported by the browser.

## What is included

- A procedurally drawn, illustrated 960 × 640 neighbourhood, visible immediately on load.
- Eight distinct shops and rooftops plus a police chowki, striped awnings, solar panels, water tanks, rooftop washing, market stalls, a small park, and a parked auto.
- Clear asphalt lanes, numbered loot markers, high-contrast safehouse, and a dotted route home when carrying loot. Solid trees and the parked auto use the same collision grid as the AI. Decorative neighbours walk along legal streets.
- Three original talking treasures, speech bubbles, expanding noise rings, particles, and opt-in synthesized audio.
- Easy, normal, and hard police AI; solo cop has an autonomous loot-collecting opponent.
- Pause, restart, countdown, results, rematch, local records, keyboard and touch controls, and fullscreen.
- Focus indicators, a keyboard guide, live status text, reduced-motion support, and automatic pause on window blur or backgrounding.
- No remote art, fonts, game CDN, base64 sprite loading, framework, or Phaser dependency. All game art is Canvas drawing code; the tiny favicon is an independent SVG data URL.

## Validate

Requires Node.js 18 or later. No npm install is needed.

```bash
npm run check
npm test
```

Tests cover map connectivity, building collisions, pickup/drop/banking, complete chor victories, noise and hush, tags and protection, nets, pause and timeout, energy and chai, a complete AI chor round, police pursuit, and initial map rendering.

## Files

```text
dist/index.html     Page, controls, instructions, and dialogs
dist/style.css      Responsive styling
dist/engine.js      Pure deterministic simulation and pathfinding
dist/renderer.js    Canvas map, characters, loot, and effects
dist/world-art.js   Detailed neighbourhood illustration
dist/app.js         Inputs, audio, screen states, and records
tests/game.test.js  Node.js gameplay and renderer tests
```

Serve the contents of `dist/` on any static host. Relative module paths work under a repository subpath, including GitHub Pages. The source is configured for Vercel through the root `vercel.json`; other static hosts can serve `dist/` directly.

## Privacy and limitations

The game runs entirely in the browser and stores only local win records in `localStorage`. It does not request camera, microphone, location, accounts, or analytics. Sound is off until enabled. It is an original implementation inspired by the neighbourhood chase and talking-loot concept in the supplied reference. It does not include the reference site's source or assets.

Automated simulation and renderer checks are included. Interactive browser QA was unavailable in the build environment; test your chosen laptop, keyboard, and mobile browser before a live demonstration.
