import { timedSegment } from '../sessionBuilders';
import { pushPositionAt, validateSessionPlan } from '../sessionPlan';
import { fourByFourPlan } from './fixtures';

describe('pushPositionAt', () => {
  const plan = fourByFourPlan();
  // The 4×4: warm-up and pickups (0–4), then pushes at 5, 7, 9 and 11 with rests between.
  const pushIndexes = [5, 7, 9, 11];

  it('counts pushes from 0 and knows how many the plan has', () => {
    expect(pushIndexes.map((index) => pushPositionAt(plan, index))).toEqual([
      { index: 0, count: 4 },
      { index: 1, count: 4 },
      { index: 2, count: 4 },
      { index: 3, count: 4 },
    ]);
  });

  it('is null for pickups, rests and indexes past the end', () => {
    expect(pushPositionAt(plan, 1)).toBeNull();
    expect(pushPositionAt(plan, 6)).toBeNull();
    expect(pushPositionAt(plan, plan.segments.length)).toBeNull();
  });
});

describe('the stroke rate range', () => {
  it('must hold the drum rate it sits around', () => {
    const push = timedSegment('push', 60_000);
    const plan = { segments: [push], getSeatedHoldMs: 0, coachingMode: 'effort' as const };
    expect(() => validateSessionPlan(plan)).not.toThrow();
    const offRange = { ...push, strokeRateRange: { low: 18, high: 22 } };
    expect(() => validateSessionPlan({ ...plan, segments: [offRange] })).toThrow(
      'range 18–22 must hold its drum rate 27',
    );
  });
});
