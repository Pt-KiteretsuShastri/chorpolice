# Gully Chase · Bigger Gully, Louder Maal

A complete, browser-local chor–police game for **“Using technology to find joy.”** Convince three opinionated treasures to come along, escape through a lively neighbourhood, and bring the maal home. Solo chor, solo cop and same-keyboard two-player are included.

The page contains the game, a role-aware controls sidebar and a friend invitation. The sidebar stays beside the playfield on wide screens and moves underneath it on smaller screens. No marketing sections, accounts, paid APIs, runtime dependencies or remote assets.

## Deploy to Vercel

Import **[Pt-KiteretsuShastri/chorpolice](https://github.com/Pt-KiteretsuShastri/chorpolice)** into Vercel. Keep the repository root as the Root Directory. The checked-in `vercel.json` serves the already-authored `dist` directory directly.

| Setting | Value |
| --- | --- |
| Framework Preset | Other (`framework: null`) |
| Root Directory | `.` |
| Install Command | Empty / skipped |
| Build Command | Empty / skipped |
| Output Directory | `dist` |
| Environment variables | None |

Do not use `npm start` as a deployment build command; it starts a development server. A connected Vercel project can deploy pushes to `main`. Repository changes do not by themselves confirm a successful Vercel deployment.

## Run locally

```bash
git clone https://github.com/Pt-KiteretsuShastri/chorpolice.git
cd chorpolice
npm start
```

Open http://localhost:8080. `npm start` uses Python 3 to serve `dist`; alternatively run `python3 -m http.server 8080 --directory dist`. Use HTTP rather than opening the HTML as a file, because the game uses ES modules. No installation or compilation is needed.

## Play

**Chor:** persuade and deliver three treasures, one at a time, to the green safehouse within 120 seconds. Press E beside a treasure, read its wish and choose the matching offer. A wrong offer makes noise; a good offer earns silence. Trust gradually falls while travelling, so renew your promise before the object starts complaining.

**Cop:** tag the chor three times, or keep at least one treasure unbanked until the timer ends. A tag returns carried loot to its original position; banked loot stays safe. Nets require clear sight and briefly stun a nearby chor.

| Action | Solo chor / P1 | Solo cop | P2 cop |
| --- | --- | --- | --- |
| Move | WASD (or arrows in solo) | WASD or arrows | Arrows |
| Sprint | Shift | Shift | `/` |
| Talk, bank, sit / leave chai | E | — | — |
| Choose an offer | 1, 2, 3 | — | — |
| Renew a promise | F | — | — |
| Drop loot on reachable ground | Q | — | — |
| Climb / descend / leap rooftops | Space | — | — |
| Throw net (5-second cooldown) | — | Space | Enter |
| Overview | M | M | M |
| Pause / resume | P or Escape | P or Escape | P or Escape |

- **Rooftops:** amber ladder markers let the chor climb up or down. Face an adjacent roof and jump from its edge to cross a gap. Each jump costs 18 energy. Movement stays within a roof's footprint, and ground patrols and nets cannot catch a rooftop chor. Banking happens on the street.
- **Tea camouflage:** press E beside either chair at Chai & Gossip. While seated the chor is invisible and untouchable, even to patrol cars. Energy recovers and carried loot stays quiet, but the round timer continues. E leaves the seat.
- **Energy:** sprinting costs energy; walking or resting restores it. Chai cups refill energy and return after 16 seconds. Both roles can drink them.
- **Patrols:** two animated police cars follow connected street circuits from the chowki. Sustained sightings radio the chor's location to the cop. A nearby alerted car can tag, with a visible warning before it does. Break sight, use rooftops or sit for chai.
- **Two players:** local play on one keyboard. The shared camera keeps both players visible. Solo touch controls are available on small screens and touch devices. There is no online multiplayer.

## The neighbourhood

The world is **40 × 26 tiles at 32 px**: 1280 × 832, approximately 1.73 times the previous area. Bazaar, radio chowk, residential gullies, drama club, park courtyard, chai corner, police chowki and green safehouse connect through street loops, narrow side lanes and open chase areas.

`world.js` is the geometry source for drawing, ground collision, roof boundaries, loot validation and BFS navigation. Buildings, trees, banyan, fruit cart, scooter and parked auto share the same solid grid. Roof decorations are decorative. Every spawn candidate, tea seat and rooftop access point is validated as reachable from home. The painted level uses a finer 8 px navigation graph for curved lanes and courtyard gates while keeping the 32 px world tiles.

The supplied detailed neighbourhood image is now the actual level background, bundled locally as `dist/assets/neighbourhood.webp`. It is cleaned of baked-in players, loot, route arrows and parked patrol vehicles so animated game objects remain truthful. The bazaar, park, chai stall, chowki and safehouse keep their illustrated positions. Authored polygon footprints follow the visible façades, walls and parked scooters; traversable rooftop terraces and access markers are defined separately.

Steam, shop bulbs, laundry, falling leaves, birds, walkers and police cars animate over the painted scene. A local geometry-based fallback appears while the image decodes or if it cannot load. Reduced-motion preference freezes decorative animation and disables camera easing; movement needed to play remains visible.

Solo uses a clamped follow camera. Local two-player shares a camera that fits both actors. A screen-anchored minimap, overview toggle, numbered objectives and dotted route home support navigation. The whole map renders before Start.

## Randomness and rematches

- Twenty validated candidate locations are spread across five loot districts. Each round chooses three different districts, three distinct locations and three different loot personalities.
- Candidates need player clearance, a route home, distance from the safehouse and cop spawn, and at least 100 px separation from the other treasures. The sum of three round trips has a maximum BFS path budget of 10,500 px.
- A deterministic seeded shuffle chooses loot, locations, morning/evening light and two distinct event types/times. `?seed=2401` reproduces that round. Given the same inputs, simulation and event placement are reproducible too.
- Rematch makes a new seed and avoids the preceding arrangement. **Replay this seed** intentionally recreates it. If an alternative needs a retry, the game exposes the resulting effective seed so the invitation still reproduces it exactly.
- **Invite a friend** copies the seeded challenge URL; it does not send a message or create an online session.

| Personality | Difference | What earns silence |
| --- | --- | --- |
| Chef Seeti | Loud pressure-cooker whistles; slight weight | A peaceful picnic |
| Sir Jeet-a-Lot | Heaviest item, modest speed penalty | An admiring audience |
| Samosa Singh | Light, with chutney complaints | Extra chutney |
| Bol Bachchan Radio | Far-reaching chatter; slight weight | An exclusive radio show |
| Chappal Express | Light; four-second speed perk on pickup | A first-class ride |

Two non-overlapping, twelve-second events are drawn from **Chai Happy Hour** (three extra energy cups), **Chutney Sprint** (marked speed pickups) and **Wrong Number!** (a false radio location for police to investigate). A banner announces each four seconds beforehand and counts down its duration. Sight can override a decoy, so the chor must still break line of sight. Quiet and clean escapes earn result-screen recognition without changing the three-delivery win condition.

## Voices and accessibility

Start is the user interaction that enables optional browser speech and synthesized sound effects. **Voice** and **SFX** have separate toggles. Captions stay on when muted. Speech prefers an installed Indian English voice, uses Hindi for translated lines where available, handles delayed voices and falls back to other voices or captions. Actual voices depend on the browser/device. No microphone permission or API key is requested.

Dialogue has per-character cooldowns, recent-line avoidance and priority. The audio controller cancels stale utterances instead of building a queue. Pause, restart, role changes and quit stop speech. Switching tabs or losing window focus automatically pauses. Controls have visible focus states; help and invitations use native dialogs. Fullscreen is offered where supported.

Only voice/SFX preferences are stored locally. No analytics, accounts, camera, microphone, location or network services are used by the game.

## Verify

Requires Node.js 18 or later. No npm installation is required.

```bash
npm run check
npm test
```

The **31 automated tests** cover all marked landmarks and courtyard gates, solid footprints, contiguous car routes, seeded replay and alternative layouts, 200 randomized round layouts, district/personality uniqueness, travel bounds, collision movement, persuasion and refusal, trust/noise, dropping/banking/winning, tags, nets, stamina, pause, timeout, rooftop transitions, tea protection, patrol detection, cop states, all events and cleanup, separate two-player inputs, speech fallback/voice loading/priority/cancellation, camera visibility, initial rendering and local references/configuration.

Complete AI chor victories are simulated over four seeds at each difficulty with patrol traffic enabled. Cop victories are simulated against an idle chor. Canvas rendering was also checked with a raster Canvas implementation at full-map, desktop and 360 px phone widths.

**Verification limit:** interactive browser control was unavailable in the build environment. Live device speech output, actual touch events, fullscreen, browser layout and human-paced end-to-end play were not browser-tested. The simulation, input mappings, fallback paths and Canvas renders were checked; try the deployed game on the hackathon laptop and phone before presenting.

## Source layout

| File | Responsibility |
| --- | --- |
| `dist/index.html`, `dist/style.css` | Focused game interface, instructions, invitation, responsive controls |
| `dist/world.js` | Shared geometry, collision, roofs, BFS paths and patrol circuits |
| `dist/random.js`, `dist/dialogue.js` | Seeded randomness and personalities/lines |
| `dist/engine.js` | Browser-independent game rules, AI, events and state |
| `dist/world-art.js`, `dist/renderer.js` | Local Canvas artwork and animated rendering |
| `dist/camera.js` | Clamped solo/shared/overview camera |
| `dist/audio.js` | Optional speech synthesis and sound effects |
| `dist/input.js`, `dist/app.js` | Input mapping and browser interface wiring |
| `tests/*.test.js` | Simulation, world, audio, camera and renderer checks |
| `vercel.json` | Static `dist` deployment configuration |
