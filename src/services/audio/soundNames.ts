/** Every sound file in assets/audio, by name without extension (see docs/design/sound-spec.md). */
export const SOUND_NAMES = [
  'war-horn',
  'push-end-horn',
  'push-start-strike',
  'hold-signal',
  'drum-hit',
  'ease-off-bell',
  'sea-calm',
  'crew-murmur',
] as const;

/** The name of one sound file in assets/audio. */
export type SoundName = (typeof SOUND_NAMES)[number];
