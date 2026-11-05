import { plannedLengthMs, validateSessionPlan } from '../../domain/session/sessionPlan';
import { SLICE_PLAN } from '../slicePlan';

const MINUTE = 60_000;

describe('the slice plan (U7: week 3 Beginner, 3×3′ / 3′)', () => {
  it('can be rowed, lasts 30 minutes and coaches by effort', () => {
    expect(() => validateSessionPlan(SLICE_PLAN)).not.toThrow();
    expect(plannedLengthMs(SLICE_PLAN)).toBe(30 * MINUTE);
    expect(SLICE_PLAN.coachingMode).toBe('effort');
  });

  it('warms up for 10 minutes with two pickups before the first push, then rows three 3′ pushes', () => {
    const segments = SLICE_PLAN.segments.flatMap((segment) =>
      segment.type === 'open' ? [] : [segment],
    );
    const firstPush = segments.findIndex((segment) => segment.type === 'push');
    const warmUp = segments.slice(0, firstPush);
    expect(warmUp.reduce((sum, segment) => sum + segment.durationMs, 0)).toBe(10 * MINUTE);
    expect(warmUp.filter((segment) => segment.type === 'pickup')).toHaveLength(2);
    const pushes = segments.filter((segment) => segment.type === 'push');
    expect(pushes.map((push) => push.durationMs)).toEqual([3 * MINUTE, 3 * MINUTE, 3 * MINUTE]);
  });
});
