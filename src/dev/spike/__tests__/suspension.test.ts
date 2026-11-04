import { assessSuspension } from '../suspension';

describe('assessSuspension', () => {
  it('reports a run where JavaScript kept ticking and both clocks agree', () => {
    expect(
      assessSuspension({
        monotonicElapsedMs: 60_000,
        wallElapsedMs: 60_050,
        tickCount: 60,
        tickIntervalMs: 1_000,
      }),
    ).toEqual({ wasSuspended: false, monotonicLagMs: 50, isMonotonicReliable: true });
  });

  it('detects suspension from missing ticks', () => {
    const result = assessSuspension({
      monotonicElapsedMs: 180_000,
      wallElapsedMs: 180_000,
      tickCount: 12,
      tickIntervalMs: 1_000,
    });
    expect(result.wasSuspended).toBe(true);
    expect(result.isMonotonicReliable).toBe(true);
  });

  it('flags a monotonic clock that stopped while the phone slept', () => {
    const result = assessSuspension({
      monotonicElapsedMs: 40_000,
      wallElapsedMs: 180_000,
      tickCount: 10,
      tickIntervalMs: 1_000,
    });
    expect(result).toEqual({
      wasSuspended: true,
      monotonicLagMs: 140_000,
      isMonotonicReliable: false,
    });
  });

  it('allows the monotonic clock up to one second behind the wall clock', () => {
    const atLimit = assessSuspension({
      monotonicElapsedMs: 59_000,
      wallElapsedMs: 60_000,
      tickCount: 60,
      tickIntervalMs: 1_000,
    });
    const pastLimit = assessSuspension({
      monotonicElapsedMs: 58_999,
      wallElapsedMs: 60_000,
      tickCount: 60,
      tickIntervalMs: 1_000,
    });
    expect(atLimit.isMonotonicReliable).toBe(true);
    expect(pastLimit.isMonotonicReliable).toBe(false);
  });

  it('rejects a run with no elapsed time', () => {
    expect(() =>
      assessSuspension({
        monotonicElapsedMs: 0,
        wallElapsedMs: 0,
        tickCount: 0,
        tickIntervalMs: 1_000,
      }),
    ).toThrow(/elapsed/);
  });
});
