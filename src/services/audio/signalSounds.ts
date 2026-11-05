import type { Cue } from '../../domain/session/sessionMachine';
import type { SoundName } from './assets';

/** Every signal the rowing screen plays: the session machine's cues, plus the heart-rate ease-off (R36). */
export type SignalKind = Cue['kind'] | 'easeOff';

/** A signal's sound; `repeat` strikes it again and again, `spacingMs` apart, as the ease-off bells are. */
export type SignalSound = {
  readonly sound: SoundName;
  readonly repeat?: { readonly times: number; readonly spacingMs: number };
};

/** Each signal's sound, as in docs/design/sound-spec.md. Their visual twins live in the rowing feature. */
export const SIGNAL_SOUNDS: Record<SignalKind, SignalSound> = {
  countIn: { sound: 'drum-hit' },
  horn: { sound: 'war-horn' },
  pushStart: { sound: 'push-start-strike' },
  holdEffort: { sound: 'hold-signal' },
  pushEnd: { sound: 'push-end-horn' },
  easeOff: { sound: 'ease-off-bell', repeat: { times: 3, spacingMs: 600 } },
};

/**
 * How long the drum stays quiet for a signal: until its last strike's file ends, echo included, as in
 * listening test B. `soundLengthMs` is the decoded file's length, so the gap follows the sound itself.
 */
export function drumGapMs(signal: SignalSound, soundLengthMs: number): number {
  const lastStrikeAtMs = signal.repeat ? (signal.repeat.times - 1) * signal.repeat.spacingMs : 0;
  return lastStrikeAtMs + soundLengthMs;
}
