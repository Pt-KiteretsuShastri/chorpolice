# Third-party notices

## PeerJS 1.5.5

The browser distribution is bundled locally at `dist/vendor/peerjs-1.5.5.min.js`.

- Source: https://github.com/peers/peerjs
- Release package: https://registry.npmjs.org/peerjs/-/peerjs-1.5.5.tgz
- License: MIT, reproduced in `dist/vendor/peerjs-LICENSE.txt`
- Package integrity verified before extracting the browser distribution:
  `sha512-viMUCPDL6CSfOu0ZqVcFqbWRXNHIbv2lPqNbrBIjbFYrflebOjItJ4hPfhjnuUCstqciHVu9vVJ7jFqqKi/EuQ==`

PeerJS Cloud is used only when a player creates or joins an online room. Its default ICE configuration supplies STUN/TURN endpoints. Service availability and restrictive network conditions can affect connections. The game never calls the media/camera/microphone APIs.

## LinkeDOM 0.18.12

Optional development-only dependency for the DOM integration test. It is not served to players or needed to deploy the game. See its installed license for attribution.

## Map

The map is derived from the user's supplied image, cleaned with the built-in image editor and bundled locally. See `docs/map-asset.md` for the exact prompt and geometry mapping.
