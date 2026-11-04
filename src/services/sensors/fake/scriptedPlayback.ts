import type { MonotonicClock } from '../../../domain/session/clock';

/**
 * Plays a trace of timed readings against a clock, for fake sensors (KTD10, KTD18). Trace times
 * are offsets from `start`; readings go out stamped with the clock's time, as a real strap's would.
 */
export class ScriptedPlayback<Reading extends { readonly atMs: number }> {
  private listener: ((reading: Reading) => void) | null = null;
  private startedAtMs = 0;
  private nextIndex = 0;

  constructor(
    private readonly clock: MonotonicClock,
    private readonly trace: readonly Reading[],
  ) {
    trace.forEach((reading, index) => {
      const previous = trace[index - 1];
      if (previous && reading.atMs < previous.atMs) {
        throw new Error(`Trace readings must be in time order; reading ${index} goes back in time`);
      }
    });
  }

  /** Starts the trace from the clock's current time; throws if it's already playing. */
  start(onReading: (reading: Reading) => void): void {
    if (this.listener) {
      throw new Error('This fake sensor is already started');
    }
    this.listener = onReading;
    this.startedAtMs = this.clock.nowMs();
    this.nextIndex = 0;
  }

  stop(): void {
    this.listener = null;
  }

  /** Sends every reading that is due by the clock's current time. Test mode calls this on a timer. */
  pump(): void {
    const elapsedMs = this.clock.nowMs() - this.startedAtMs;
    for (
      let reading = this.trace[this.nextIndex];
      this.listener && reading && reading.atMs <= elapsedMs;
      reading = this.trace[this.nextIndex]
    ) {
      this.nextIndex += 1;
      this.listener({ ...reading, atMs: this.startedAtMs + reading.atMs });
    }
  }
}
