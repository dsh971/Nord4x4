/**
 * Every sound in assets/audio, bundled by Metro (see docs/design/sound-spec.md). The files are built
 * by docs/design/tools/build_sounds.py; a missing one fails the bundle and the Jest run.
 */
export const SOUND_FILES = {
  'war-horn': require('../../../assets/audio/war-horn.wav') as number,
  'push-end-horn': require('../../../assets/audio/push-end-horn.wav') as number,
  'push-start-strike': require('../../../assets/audio/push-start-strike.wav') as number,
  'hold-signal': require('../../../assets/audio/hold-signal.wav') as number,
  'drum-catch': require('../../../assets/audio/drum-catch.wav') as number,
  'drum-tap': require('../../../assets/audio/drum-tap.wav') as number,
  'ease-off-bell': require('../../../assets/audio/ease-off-bell.wav') as number,
  'sea-calm': require('../../../assets/audio/sea-calm.m4a') as number,
  'crew-murmur': require('../../../assets/audio/crew-murmur.m4a') as number,
};

/** The name of one sound file in assets/audio. */
export type SoundName = keyof typeof SOUND_FILES;

/**
 * How far into a file its attack starts. The drum cuts keep 10 ms before each hit so it doesn't
 * click (build_sounds.py, cut_hit), so the engine starts them that much early to land on the beat.
 */
export const SOUND_ONSET_MS: Partial<Record<SoundName, number>> = {
  'drum-catch': 10,
  'drum-tap': 10,
};

/**
 * Each sound's starting playback gain. Signals start near-equal in loudness as heard (sound spec:
 * horns and strike about −7 LUFS, drum −10, wood −17, bell −18), so the bell, the R36 safety cue,
 * isn't lost under the drum. Tuned by ear on the phone.
 */
export const PLAYBACK_GAIN: Record<SoundName, number> = {
  'war-horn': 0.4,
  'push-end-horn': 0.4,
  'push-start-strike': 0.4,
  'hold-signal': 1,
  // −12.5 LUFS at 0.6 plays as loud as the old taiko did (−10.1 at 0.45): about −17 LUFS as heard.
  'drum-catch': 0.6,
  'drum-tap': 0.6,
  'ease-off-bell': 1,
  'sea-calm': 1,
  'crew-murmur': 1,
};
