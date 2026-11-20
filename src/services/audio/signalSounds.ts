import type { Cue } from '../../domain/session/sessionMachine';
import type { SoundName } from './assets';

/** Every signal the rowing screen plays: the session machine's cues, plus the heart-rate ease-off (R36). */
export type SignalKind = Cue['kind'] | 'easeOff';

/** A signal's sound; `repeat` strikes it again and again, `spacingMs` apart, as the ease-off bells are. */
export type SignalSound = {
  readonly sound: SoundName;
  readonly repeat?: { readonly times: number; readonly spacingMs: number };
};

const PUSH_START: SignalSound = { sound: 'push-start-strike' };
// One sound ends every push and pickup, so the horn only ever means work coming (G6d).
const WORK_END: SignalSound = { sound: 'end-gong' };

/** Each signal's sound, as in docs/design/sound-spec.md. Their visual twins live in the rowing feature. */
export const SIGNAL_SOUNDS = {
  countIn: { sound: 'drum-catch' },
  horn: { sound: 'war-horn' },
  pushStart: PUSH_START,
  pickupStart: PUSH_START,
  holdEffort: { sound: 'hold-signal' },
  pushEnd: WORK_END,
  pickupEnd: WORK_END,
  easeOff: { sound: 'ease-off-bell', repeat: { times: 3, spacingMs: 600 } },
} as const satisfies Record<SignalKind, SignalSound>;

/**
 * How long the rower's music stays ducked after a signal's file ends. A start strike is scheduled
 * only LOOKAHEAD_MS ahead, 0.8 s after the horn ends; without the hold the music would come up
 * between them and dip again.
 */
export const DUCK_HOLD_MS = 1_000;

/** When the rower's music comes back up after signals whose drum gaps end at `gapEndsMs`. */
export function duckReleaseAtMs(gapEndsMs: number): number {
  return gapEndsMs + DUCK_HOLD_MS;
}

/**
 * How long the drum stays quiet for a signal: until its last strike's file ends, echo included, as in
 * listening test B. `soundLengthMs` is the decoded file's length, so the gap follows the sound itself.
 */
export function drumGapMs(signal: SignalSound, soundLengthMs: number): number {
  const lastStrikeAtMs = signal.repeat ? (signal.repeat.times - 1) * signal.repeat.spacingMs : 0;
  return lastStrikeAtMs + soundLengthMs;
}
