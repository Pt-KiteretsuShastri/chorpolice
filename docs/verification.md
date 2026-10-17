# Verification notes · version 3

The map, sidebar and online-room changes were committed as separate completed steps:

| Step | Commit |
| --- | --- |
| Supplied map graphics and aligned geometry | [2a37945](https://github.com/Pt-KiteretsuShastri/chorpolice/commit/2a379458bc0f39dfa8913b6e6b1aaf5d61546c6b) |
| Responsive controls sidebar | [576d274](https://github.com/Pt-KiteretsuShastri/chorpolice/commit/576d2747706e42d6b3b773a921d98c0354facddd) |
| Online rooms and join links | [2ea4694](https://github.com/Pt-KiteretsuShastri/chorpolice/commit/2ea469422fc7abb4c451afced8f89b2fd4d6a22a) |

Documentation is finalized in a following commit. Vercel continues to serve `dist`, with no install or build command and no environment variables.

## Passed

- `npm run check`: syntax checks for every authored browser module.
- `npm test`: 41 passing tests. This preserves the previous gameplay cases while aligning them to the supplied artwork and adds ten online/protocol tests.
- `npm run test:dom`: actual application modules are loaded into two isolated DOM contexts with paired test data channels. The harness creates a room, opens its link in the second context, readies/starts both players, sends guest controls, pauses/resumes both, prepares a rematch, disconnects/rejoins during that round, checks fresh guest inputs after rejoining, and returns to solo.
- Seeded randomization: 200 rounds checked for distinct personalities, districts, clearance, separation and path-distance bounds.
- Complete simulation rounds: AI chor wins over four seeds at all difficulties, with police traffic enabled. Cop victories are simulated against an idle chor. Banking, caught-loot reset, timer expiry and event cleanup are checked.
- Map geometry: all twenty candidate locations, both spawns, tea seats, chai cups, rooftop access points, park entrance and safehouse gate are reachable. Path segments avoid authored façades, walls and parked scooters.
- Raster Canvas inspection of the actual bundled background, gameplay markers and actors. This verifies Canvas output, not browser page layout.

- Production HTTP checks: the page, painted WebP, bundled PeerJS client and online-room module returned HTTP 200, and their SHA-256 hashes matched the validated local files.

## Limits

A live smoke check used native WebRTC and the bundled PeerJS client. Both peers registered with PeerJS Cloud and exchanged SDP offers/answers; the data channel did not open before the connection timeout in this environment. This is not a passing live multiplayer check. The cause was not established, and real cross-device/network connectivity remains unverified.

The DOM harness uses test channels, not native WebRTC. Interactive browser control was unavailable, so browser layout, real touch input, fullscreen, device speech output and a human-paced game across two actual devices were not checked. Native browser checks should use the deployed HTTPS URL; a `localhost` invitation will not open the game on a friend's device.

## Device check procedure

1. Host: open the deployed site, choose **Online → Create online room**, then send the generated room link.
2. Guest: open it in a second browser/device, click **Join as cop**, then **Ready as cop**.
3. Host: confirm the ready status and start. Verify both clocks/scores match and guest movement/net actions reach the host.
4. Play a full round. Check loot persuasion, bank deliveries, rooftop protection, tea invisibility, shared catch count and matching result screens.
5. Pause from each side. The host resumes; neither clock should advance while paused.
6. Start a rematch, ready again, then interrupt/rejoin the guest connection. Verify the round stays paused until both are ready and guest controls work after rejoining.
7. On a phone, check controls, captions and sidebar readability. Try voices muted, SFX muted, reduced motion and fullscreen where supported.

Rooms admit one guest, require the host tab to stay open and use free third-party signaling/ICE services. Restrictive networks or a service outage may prevent a connection; the lobby provides timeout/error text and retry/leave controls. The host is trusted and authoritative; the game is intended for casual play with friends.
