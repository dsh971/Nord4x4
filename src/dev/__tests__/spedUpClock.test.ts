import { ManualClock } from '../../domain/session/clock';
import { SpedUpClock } from '../spedUpClock';

describe('SpedUpClock', () => {
  it('runs speed times faster than its base from the moment it is made', () => {
    const base = new ManualClock(5_000);
    const fast = new SpedUpClock(base, 10);
    expect(fast.nowMs()).toBe(5_000);
    base.advanceBy(150);
    expect(fast.nowMs()).toBe(6_500);
  });

  it('never goes backwards while its base moves forward', () => {
    const base = new ManualClock();
    const fast = new SpedUpClock(base, 7);
    let lastMs = fast.nowMs();
    for (const stepMs of [0, 1, 99, 0, 250]) {
      base.advanceBy(stepMs);
      expect(fast.nowMs()).toBeGreaterThanOrEqual(lastMs);
      lastMs = fast.nowMs();
    }
  });

  it.each([0, 0.5, -2, Number.NaN, Number.POSITIVE_INFINITY])('refuses a speed of %p', (speed) => {
    expect(() => new SpedUpClock(new ManualClock(), speed)).toThrow('at least as fast');
  });
});
