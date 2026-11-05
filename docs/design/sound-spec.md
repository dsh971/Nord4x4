# Sound spec

Every sound Nor4x4 plays in rowing mode, what triggers it, and what the screen shows at the same moment (U3). There is no human voice: horns, drums, wood and bells carry every cue, and each cue has a visual twin, so Silent mode loses nothing (R40, R51).

The sounds were picked by listening tests on 2026-11-04 and 2026-11-05 (see `PLAN.md`, Phase F). The files in `assets/audio/` are built by `docs/design/tools/sounds/build_sounds.py`, so they can be remade or retuned from one place.

## Signals

One-shots, scheduled ahead on the audio clock. A cue more than 2 s late is dropped rather than played late (`STALE_CUE_MS`, KTD5). While a signal plays, the drum skips its strokes and comes back on the first stroke after the signal ends (listening test B, 2026-11-05).

| Moment | Engine cue | File | Sound | On screen (R40) |
|---|---|---|---|---|
| Get seated, last 5 s | `countIn` (5 to 1) | `drum-hit.wav` | One taiko hit per second | Big 5-4-3-2-1 |
| Push in 10 s | `horn` | `war-horn.wav` | War horn: 3.2 s at 73 Hz with a growl, plus a 2 s valley echo | Edge pulse + "Ready oars" |
| Push starts | `pushStart` | `push-start-strike.wav` | Double taiko strike; the drum then lifts to push tempo | "Pull" |
| 90 s into a push (effort guidance, R30) | `holdEffort` | `hold-signal.wav` | Two hollow wood knocks, like oar shafts clacking | "Hold this effort" |
| Push ends | `pushEnd` | `push-end-horn.wav` | The war horn, sagging five semitones over its last 1.5 s; the drum slows | "Rest" |
| Above 95% of max HR for 15 s (R36) | Heart-rate coaching, not the session machine | `ease-off-bell.wav` | One handbell strike, played three times 0.6 s apart, once per push | Charcoal border glow + "Ease off ▲" |
| Session ends | `sessionCompleted` | Not chosen yet | Landfall sound (U20) | Session complete |

The push-end horn deliberately reuses the war horn. One instrument marks both edges of a push, and the falling pitch says "done" (R39: "a low horn note at the end of a push").

## Ambience

Loops that play under the signals in Full ship mode (R42), and mute while the rower's own music plays (R41).

| Layer | File | Plays | Notes |
|---|---|---|---|
| Drum | `drum-hit.wav` | One hit at each catch, at the plan's target stroke rate | Scheduled stroke by stroke rather than a pre-made loop, so any stroke rate works without stretching audio. This settles the plan's open "drum tempo method" question. |
| Calm sea | `sea-calm.m4a` | Whole session in calm scenes | 60 s loop |
| Crew murmur | `crew-murmur.m4a` | During work segments (pushes and pickups, R38) | 15 s loop, wordless |
| Open swell and rough sea (R58) | Not chosen yet | Intermediate and Hard casual rows | Needed for U19, not for the M1 slice |

## Files

| File | Length | Format | Loudness | Source | Licence |
|---|---|---|---|---|---|
| `war-horn.wav` | 5.2 s | WAV, 16-bit 48 kHz mono | Peak −1 dBFS | Synthesized (horn-5 "war horn") | Ours |
| `push-end-horn.wav` | 4.4 s | WAV, 16-bit 48 kHz mono | Peak −1 dBFS | Synthesized (end-2 "falling war horn") | Ours |
| `push-start-strike.wav` | 1.2 s | WAV, 16-bit 48 kHz mono | Peak −1 dBFS | Synthesized (strike-1 "double taiko") | Ours |
| `hold-signal.wav` | 1.0 s | WAV, 16-bit 48 kHz mono | Peak −1 dBFS | Synthesized (wood-3 "oar shafts clack") | Ours |
| `drum-hit.wav` | 0.5 s | WAV, 16-bit 48 kHz mono | Peak −1 dBFS | Synthesized (drum-1 "taiko") | Ours |
| `ease-off-bell.wav` | 1.8 s | WAV, 16-bit 48 kHz mono | Peak −1 dBFS | First strike of [chromatic handbells 12 tones g1](https://freesound.org/people/radwoc/sounds/370007/) by radwoc | CC0 |
| `sea-calm.m4a` | 60 s loop | AAC 128 kbps, 48 kHz stereo | −25 LUFS | 20–82 s of [water, lake waves, light gentle lap at boats on beach](https://freesound.org/people/kyles/sounds/637945/) by kyles | CC0 |
| `crew-murmur.m4a` | 15 s loop | AAC 96 kbps, 48 kHz mono | −33 LUFS | 0–16.5 s of [R16-17 men murmuring](https://freesound.org/people/craigsmith/sounds/480808/) by craigsmith | CC0 |

- **One-shots are WAV.** AAC starts every file with about 44 ms of encoder priming, which would make a signal land late against the drum unless the decoder trims it. The six one-shots total 1.3 MB.
- **Loops are AAC.** The sea is 1.0 MB at 128 kbps against 11.5 MB as WAV, and the mono crew needs only 96 kbps. Each loop's last seconds are crossfaded into its head, so it repeats without a seam.
- **Size budget.** Xcode copies audio into the app as it is, so `build_sounds.py` is the only place sound size is controlled. The build fails if `assets/audio/` goes over 8 MB (now 2.5 MB), which leaves room for the M2 seas and landfall.
- **Loudness.** One-shots peak at −1 dBFS. The loops are levelled by loudness, with the crew 8 dB under the sea (listening test, 2026-11-05). The sea sits at −25 LUFS because its splashes peak far above its average, and that is as loud as it goes without clipping. The app sets each layer's playback level, and the mixer (R42) scales from there.
- **CC0 only.** Recordings come from Freesound under CC0, so no credit screen is needed. CC BY recordings were considered and rejected on 2026-11-05.

## Rebuilding the files

1. Download the three originals from the Freesound links above. A free account is needed for the full-quality files; the site's previews are lower quality and are not used.
2. Run, with ffmpeg installed:

   ```bash
   python3 -I docs/design/tools/sounds/build_sounds.py --bell <370007 wav> --sea <637945 flac> --crew <480808 wav>
   python3 -m unittest discover -s docs/design/tools/sounds
   ```

## To check on the phone (Phase G)

- **Loop seams.** Apple's AAC encoder pads each loop: the files hold 2112 samples of priming and a few hundred samples at the end. macOS reads the exact 60 s and 15 s, but if the playback library doesn't trim the padding, each repeat has a hitch of about 50 ms. The fix is to set the buffer's loop points to the exact length, or to fall back to WAV.
- **Levels.** The relative levels of signals, drum, sea and crew get tuned by ear on the phone's speaker, under and over Spotify.
- **The push-end horn.** If, over the drum and sea, it still sounds too much like the war horn, try a higher, lighter horn instead.
