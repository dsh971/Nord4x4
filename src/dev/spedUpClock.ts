import type { MonotonicClock } from '../domain/session/clock';

/**
 * A clock that runs `speed` times faster than `base`, from the moment it's made, so the walkthrough
 * can row the slice in minutes (G7a). Test mode only: load it inside `if (__DEV__ && isTestMode)`.
 */
export class SpedUpClock implements MonotonicClock {
  private readonly startMs: number;

  constructor(
    private readonly base: MonotonicClock,
    private readonly speed: number,
  ) {
    if (!Number.isFinite(speed) || speed < 1) {
      throw new Error(`A sped-up clock runs at least as fast as its base; got a speed of ${speed}`);
    }
    this.startMs = base.nowMs();
  }

  nowMs(): number {
    return this.startMs + (this.base.nowMs() - this.startMs) * this.speed;
  }
}
