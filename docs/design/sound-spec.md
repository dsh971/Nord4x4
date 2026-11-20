# Sound spec

Every sound Nor4x4 plays in rowing mode, what triggers it, and what the screen shows at the same moment (U3). There is no human voice: horns, drums, wood and bells carry every cue, and each cue has a visual twin, so Silent mode loses nothing (R40, R51).

The sounds were picked by listening tests on 2026-11-04 and 2026-11-05 (see `PLAN.md`, Phase F), and the end gong by one on 2026-11-20 (G6d). The files in `assets/audio/` are built by `docs/design/tools/build_sounds.py`, so they can be remade or retuned from one place.

## Signals

One-shots, scheduled ahead on the audio clock. A cue more than 2 s late is dropped rather than played late (`STALE_CUE_MS`, KTD5). While a signal plays, the drum skips its strokes and comes back on the first stroke after the signal's file ends, echo tail included, as in listening test B (2026-11-05). The files carry no silence padding, so a file's length is exactly how long the drum stays quiet: the drum gap column below.

| Moment | Engine cue | File | Sound | Drum gap | On screen (R40) |
|---|---|---|---|---|---|
| Get seated, last 5 s | `countIn` (5 to 1) | `drum-catch.wav` | One deep drum hit per second | None; the drum hasn't started | Big 5-4-3-2-1 |
| Push or pickup in 10 s | None: read off session time (`calledWorkAt`) | None | Silent; the horn follows | None | Edge pulse + "Ready oars" (push) or "Pickup coming" (pickup), until it starts |
| Push or pickup in 6 s | `horn` | `war-horn.wav` | War horn: 3.2 s at 73 Hz with a growl, plus a 2 s valley echo | 5.2 s, so the drum is back 0.8 s before the start strike | The 10 s warning, still up |
| Push starts | `pushStart` | `push-start-strike.wav` | Double taiko strike; the drum then lifts to push tempo | 0.67 s | "Pull" |
| Pickup starts | `pickupStart` | `push-start-strike.wav` | As a push starts | 0.67 s | "Pickup" |
| 90 s into a push (effort guidance, R30) | `holdEffort` | `hold-signal.wav` | Two hollow wood knocks, like oar shafts clacking | 0.39 s | "Hold this effort" |
| Push ends | `pushEnd` | `end-gong.wav` | A soft gong under a wooden flute, its first 2.5 s faded out; the drum slows | 2.5 s | "Rest" |
| Pickup ends | `pickupEnd` | `end-gong.wav` | As a push ends | 2.5 s | "Back to easy" |
| Above 95% of max HR for 15 s (R36) | Heart-rate coaching, not the session machine | `ease-off-bell.wav` | One handbell strike, played three times 0.6 s apart, once per push | 3.0 s | Charcoal border glow + "Ease off ▲" |
| Session ends | `sessionCompleted` | Not chosen yet | Landfall sound (U20) | None; the row is over | Session complete |

The war horn only ever means work coming. Work ends with the gong instead, which replaced a falling war horn on 2026-11-20 (G6d): the falling horn didn't read as "done", and at 2.5 s the drum is back about a stroke later, as the rower settles into easy rowing. Warm-up pickups are pushes in miniature and use the same three sounds; only their banners differ (G6b, 2026-11-10).

The rower's music stays ducked for 1 s after a signal's file ends (`DUCK_HOLD_MS`). The start strike is scheduled only 0.6 s ahead, 0.8 s after the horn ends, so without the hold the music would come up between the two and dip again. The 0.8 s gap between the horn and the strike holds only for a horn on time: one played up to 2 s late (`STALE_CUE_MS`) runs into the push. The hold applies to every signal, so the music stays down across the count-in's five beats, 1 s apart, and comes up once after the last. Pausing gives the music back; resuming ducks it again for any signal still sounding or already scheduled.

## Ambience

Loops that play under the signals in Full ship mode (R42), and play about 6 dB quieter while the rower's own music plays (R41). Signals are never lowered. Nothing plays while the app isn't open (R43): notifications with the war horn sound warn of pushes and pickups instead.

| Layer | File | Plays | Notes |
|---|---|---|---|
| Drum | `drum-catch.wav`, `drum-tap.wav` | A deep hit on every catch at the plan's target stroke rate, soft in easy rowing. In pushes and pickups, two rising taps lead into each catch, at 70% and 85% of the stroke ("tap · tap · BOOM", drum audition clip 3, 2026-11-05). | Scheduled stroke by stroke rather than a pre-made loop, so any stroke rate works without stretching audio, and the taps follow the rate as shares of the stroke. The catch stays on the stroke grid the oars use. |
| Calm sea | `sea-calm.m4a` | Whole session in calm scenes | 60 s loop |
| Crew murmur | `crew-murmur.m4a` | During work segments (pushes and pickups, R38) | 15 s loop, wordless |
| Open swell and rough sea (R58) | Not chosen yet | Intermediate and Hard casual rows | Needed for U19, not for the M1 slice |

## Files

| File | Length | Format | Loudness | Source | Licence |
|---|---|---|---|---|---|
| `war-horn.wav` | 5.2 s | WAV, 16-bit 48 kHz mono | −7.1 LUFS | Synthesized (horn-5 "war horn") | Ours |
| `end-gong.wav` | 2.5 s | WAV, 16-bit 48 kHz mono | −10.8 LUFS | First 2.5 s of [gong with flute](https://freesound.org/people/SoundsExciting/sounds/213096/) by SoundsExciting, faded out over 0.8 s | CC0 |
| `push-start-strike.wav` | 0.67 s | WAV, 16-bit 48 kHz mono | −7.0 LUFS | Synthesized (strike-1 "double taiko") | Ours |
| `hold-signal.wav` | 0.39 s | WAV, 16-bit 48 kHz mono | −17.0 LUFS | Synthesized (wood-3 "oar shafts clack") | Ours |
| `drum-catch.wav` | 0.55 s | WAV, 16-bit 48 kHz mono | −12.5 LUFS | The low opening hit of [rowrow](https://freesound.org/people/theredshore/sounds/83977/) by theredshore | CC0 |
| `drum-tap.wav` | 0.55 s | WAV, 16-bit 48 kHz mono | −12.7 LUFS | The higher hit at 3.18 s of the same recording | CC0 |
| `ease-off-bell.wav` | 1.8 s | WAV, 16-bit 48 kHz mono | −18.3 LUFS | First strike of [chromatic handbells 12 tones g1](https://freesound.org/people/radwoc/sounds/370007/) by radwoc | CC0 |
| `sea-calm.m4a` | 60 s loop | AAC 128 kbps, 48 kHz stereo | −25 LUFS | 20–82 s of [water, lake waves, light gentle lap at boats on beach](https://freesound.org/people/kyles/sounds/637945/) by kyles | CC0 |
| `crew-murmur.m4a` | 15 s loop | AAC 96 kbps, 48 kHz mono | −33 LUFS (−36 measured as mono) | 0–16.5 s of [R16-17 men murmuring](https://freesound.org/people/craigsmith/sounds/480808/) by craigsmith | CC0 |

- **One-shots are WAV.** AAC starts every file with about 44 ms of encoder priming, which would make a signal land late against the drum unless the decoder trims it. The seven one-shots total about 1.3 MB.
- **Drum hits start 10 ms early.** Each drum cut keeps 10 ms before its attack so it doesn't click, and the engine starts it that much early (`SOUND_ONSET_MS`), so the attack lands on the beat.
- **Loops are AAC.** The sea is 1.0 MB at 128 kbps against 11.5 MB as WAV, and the mono crew needs only 96 kbps. The audio just after each loop's cut is crossfaded into its head, so the end runs straight on into the start.
- **Size budget.** Xcode copies audio into the app as it is, so `build_sounds.py` is the only place sound size is controlled. The build stages every file and moves them in only if every expected file exists and the total fits 8 MB, so a failed build leaves `assets/audio/` untouched. A test also checks the committed folder against the budget, the formats above and silent first and last samples, on every test run (now 2.3 MB), which leaves room for the M2 seas and landfall.
- **Loudness** is measured as heard: a mono file plays on both speakers, which sounds 3 dB louder than a plain mono measurement. One-shots peak at −1 dBFS, so they differ by about 11 dB in loudness: the horn and strike are near −7 LUFS and the gong −10.8, while the wood (−17) and the ease-off bell (−18.3) are the quietest. The bell is the R36 safety cue and has to cut through the drum, so Phase G sets a playback gain per signal. Start by lifting the wood and bell about 10 dB relative to the horns, then tune by ear.
- **The loops** are levelled by loudness, with the crew 8 dB under the sea as heard (listening test, 2026-11-05; both audition clips were mono). The sea sits at −25 LUFS because its splashes peak far above its average and the build's clip guard allows little more. The app sets each layer's playback level, and the mixer (R42) scales from there.
- **CC0 only.** Recordings come from Freesound under CC0, so no credit screen is needed. CC BY recordings were considered and rejected on 2026-11-05.

## Rebuilding the files

1. Download the five originals from the Freesound links above. A free account is needed for the full-quality files. The build checks each file's SHA-256 and refuses anything else, such as the site's lower-quality previews.
2. Run from any folder, with ffmpeg and macOS `afconvert` installed:

   ```bash
   python3 -I docs/design/tools/build_sounds.py --drum <83977 mp3> --bell <370007 wav> --gong <213096 wav> \
     --sea <637945 flac> --crew <480808 wav>
   python3 -m unittest discover -s docs/design/tools
   ```

## To check on the phone (Phase G)

- **Loop seams.** Apple's AAC encoder pads each loop: the files hold 2112 samples of priming and a few hundred samples at the end. macOS reads the exact 60 s and 15 s, but if the playback library doesn't trim the padding, each repeat has a hitch of about 50 ms. The fix is to set the buffer's loop points to the exact length, or to fall back to WAV.
- **Levels.** The per-signal gains (see Loudness above) and the relative levels of signals, drum, sea and crew get tuned by ear on the phone's speaker, under and over Spotify.
