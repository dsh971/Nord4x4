import type { HeartRateReading } from '../sensors/heartRateSource';

/** The share of max HR above which a sustained heart rate means "ease off" (R36). */
export const EASE_OFF_PERCENT_OF_MAX = 95;
/** How long HR must stay above the threshold before the glow and bells. */
export const EASE_OFF_AFTER_MS = 15_000;
/** Readings further apart than this don't show HR stayed high in between, so the wait starts again. */
export const MAX_READING_GAP_MS = 5_000;

/** Where the ease-off check stands. */
export type EaseOffState = {
  /** When HR last rose above the threshold; null while it is at or below it, or the strap is lost. */
  readonly aboveSinceMs: number | null;
  readonly lastReadingAtMs: number | null;
  readonly isGlowing: boolean;
  /** The push the bells last rang in, so they ring once per push however long HR stays high. */
  readonly bellsRangInPush: number | null;
};

/** The ease-off check before any reading. */
export const INITIAL_EASE_OFF: EaseOffState = {
  aboveSinceMs: null,
  lastReadingAtMs: null,
  isGlowing: false,
  bellsRangInPush: null,
};

/**
 * Folds one heart-rate reading into the ease-off state and says whether the bells ring now.
 * `pushIndex` counts pushes from 0 and is null outside one. In a push the bells ring once while the
 * glow is on; elsewhere only as the glow comes on, so HR still high after a push doesn't ring again.
 */
export function observeHeartRate(
  state: EaseOffState,
  reading: HeartRateReading,
  context: { readonly maxHeartRate: number; readonly pushIndex: number | null },
): { state: EaseOffState; shouldRingBells: boolean } {
  if (!Number.isFinite(context.maxHeartRate) || context.maxHeartRate <= 0) {
    throw new Error(`Max heart rate must be a positive number; got ${context.maxHeartRate}`);
  }
  const isAbove =
    reading.type === 'sample' &&
    reading.bpm > (context.maxHeartRate * EASE_OFF_PERCENT_OF_MAX) / 100;
  if (!isAbove) {
    return {
      state: { ...state, aboveSinceMs: null, lastReadingAtMs: reading.atMs, isGlowing: false },
      shouldRingBells: false,
    };
  }
  const isContinuous =
    state.lastReadingAtMs !== null && reading.atMs - state.lastReadingAtMs <= MAX_READING_GAP_MS;
  const aboveSinceMs = (isContinuous ? state.aboveSinceMs : null) ?? reading.atMs;
  const isGlowing = reading.atMs - aboveSinceMs >= EASE_OFF_AFTER_MS;
  const shouldRingBells =
    isGlowing &&
    (context.pushIndex === null ? !state.isGlowing : context.pushIndex !== state.bellsRangInPush);
  return {
    state: {
      aboveSinceMs,
      lastReadingAtMs: reading.atMs,
      isGlowing,
      bellsRangInPush:
        shouldRingBells && context.pushIndex !== null ? context.pushIndex : state.bellsRangInPush,
    },
    shouldRingBells,
  };
}
