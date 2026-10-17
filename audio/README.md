# Hindi character voice pack

The ElevenLabs integration uses **pre-generated local MP3 clips**. It does not call a paid voice API during a match. The checked-in manifest is empty until real audio is generated; the game uses native Hindi speech or captions in the meantime.

## Recommended casting

Audition Hindi/Indian voices available in your own ElevenLabs account. Voice availability and allowed uses depend on the account; no unverified voice ID is hardcoded.

| Character | Direction |
| --- | --- |
| Chor | Young, mischievous, quick and warm |
| Inspector | Deep, stern but comic; clear Hindi |
| Neighbour | Friendly Delhi auntie/uncle, conversational |
| Chef Seeti | Anxious and theatrical |
| Sir Jeet-a-Lot | Pompous announcer |
| Samosa Singh | Cheerful snack seller |
| Bol Bachchan Radio | Energetic Hindi radio presenter |
| Chappal Express | Impatient, expressive traveller |

No cloning, microphone permission or live conversation is needed. The finite script currently has **77 clips / 2,027 text characters**. The plan command shows current counts; these are not a price or credit quote.

## Activate from GitHub without a local terminal

1. In this repository, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `ELEVENLABS_API_KEY` and save your ElevenLabs key there. Use a key with the speech generation access your account requires.
2. Choose and audition a Hindi/Indian voice in ElevenLabs, then copy its **voice ID** (not its API key).
3. Open **Actions → Generate Hindi voices → Run workflow** on `main`. Start with `chor` and provide that voice ID. This is a manual, credit-consuming generation run; it never runs automatically on pushes.
4. The workflow commits completed MP3s and their manifest to `main`; Vercel's connected project deploys them. Play a round and listen. Repeat for other characters with their own voice IDs. `all` can use the configured casting or one fallback voice; choose separate roles for distinct voices.

If generation is interrupted or rejected, completed clips are committed where possible so the next run can reuse them. The workflow needs GitHub Actions enabled and write permission to `main`; protected branches may require the local generation path and a reviewed PR instead. No key is required in Vercel for playback.

## Preview and generate

Requires Node.js 20+. `npm run audio:plan` lists the script counts without a key, request or charge. `npm run audio:plan -- --speaker chor` previews just the chor.

Set `ELEVENLABS_API_KEY` privately in the generation environment. Never put it in this JSON file, `dist`, git or a chat message. Use `npm run audio:voices` to list the voices available to the account. Fill character voice IDs in `audio/elevenlabs.config.json`. An optional `ELEVENLABS_VOICE_ID` is used for any selected role without its own configured ID, useful for a small first trial.

```bash
npm run audio:plan -- --speaker chor
npm run audio:generate -- --speaker chor
# After auditioning the results and setting the other voice IDs:
npm run audio:generate
```

Generation consumes the account's credits. It requests Hindi Devanagari lines using `eleven_multilingual_v2`; `eleven_flash_v2_5` is also supported, with `language_code: hi`. Choose the model after listening to a few clips. The script validates all selected voice IDs before any paid request, generates sequentially, saves every completed clip, and does not automatically retry billable calls. Rerunning reuses existing files and resumes incomplete generation. Changing a voice, model, settings or text produces a new filename; keep old files until the new pack is deployed so cached manifests still work.

Commit the generated `dist/assets/audio/*.mp3` files **and** `manifest.json`, then deploy `dist` normally. The key is needed only on the generation machine, never in Vercel's browser bundle. The hash-based mappings are generated from the same Hindi dialogue used by the game. Missing clips can fall back independently, so a chor-only pilot does not prevent other characters speaking through the device voice.

## Useful next audio additions

Prioritize character dialogue and loot persuasion first. A small optional sound-effects pack can follow: pressure-cooker whistles, radio tuning, a victory sting and quiet chai/bazaar ambience. These effects are suggestions, not generated assets in this release. Keep ambience subtle, obey the SFX toggle and pause, and preserve visual noise cues for muted players.

Official references: [create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), [list voices](https://elevenlabs.io/docs/api-reference/voices/search), [models](https://elevenlabs.io/docs/overview/models), [sound effects](https://elevenlabs.io/docs/overview/capabilities/sound-effects).
