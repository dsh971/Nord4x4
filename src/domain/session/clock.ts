/** A clock that never goes backwards, in milliseconds (KTD5). Its zero point means nothing on its own. */
export interface MonotonicClock {
  nowMs(): number;
}

/** The device clock. It keeps counting while iOS suspends the app (docs/spikes/native-modules.md, check 4). */
export const systemClock: MonotonicClock = { nowMs: () => performance.now() };

/** A clock that moves only when told to, for tests and test mode (KTD18). */
export class ManualClock implements MonotonicClock {
  private currentMs: number;

  constructor(startMs = 0) {
    this.currentMs = startMs;
  }

  nowMs(): number {
    return this.currentMs;
  }

  /** Moves the clock forward; throws on a negative step, which a monotonic clock can't take. */
  advanceBy(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new Error(`A monotonic clock only moves forward; got a step of ${ms} ms`);
    }
    this.currentMs += ms;
  }
}
