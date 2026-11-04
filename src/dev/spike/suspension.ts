/** What the KTD19 check measures across a stretch with the app's sound off and the phone locked. */
export interface SuspensionRun {
  /** Time elapsed on `performance.now()`, the clock KTD5 would use. */
  monotonicElapsedMs: number;
  /** Time elapsed on `Date.now()`, the reference. */
  wallElapsedMs: number;
  /** How many times a JavaScript interval fired during the run. */
  tickCount: number;
  tickIntervalMs: number;
}

export interface SuspensionVerdict {
  wasSuspended: boolean;
  /** How far the monotonic clock fell behind the wall clock. */
  monotonicLagMs: number;
  /** False when the monotonic clock stopped during sleep, so KTD5 needs a native continuous clock. */
  isMonotonicReliable: boolean;
}

const MAX_MONOTONIC_LAG_MS = 1_000;
// Below this share of the expected ticks, JavaScript was not running for part of the stretch.
const MIN_TICK_RATIO = 0.9;

/** Judges whether the app was suspended and whether `performance.now()` kept counting while it was. */
export function assessSuspension(run: SuspensionRun): SuspensionVerdict {
  if (run.wallElapsedMs <= 0) {
    throw new Error(`A suspension run needs elapsed wall time; got ${run.wallElapsedMs} ms`);
  }
  const expectedTicks = run.wallElapsedMs / run.tickIntervalMs;
  const monotonicLagMs = run.wallElapsedMs - run.monotonicElapsedMs;
  return {
    wasSuspended: run.tickCount < expectedTicks * MIN_TICK_RATIO,
    monotonicLagMs,
    isMonotonicReliable: monotonicLagMs <= MAX_MONOTONIC_LAG_MS,
  };
}
