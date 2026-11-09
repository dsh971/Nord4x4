import {
  DEFAULT_GET_SEATED_HOLD_MS,
  isWorkSegment,
  type CoachingMode,
  type HeartRateZone,
  type SessionPlan,
  type StrokeRateRange,
  type TimedSegment,
} from './sessionPlan';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
/** A kind of rowing's drum rate and the range around it the rower aims for. */
export type RowingRate = {
  readonly strokesPerMinute: number;
  readonly strokeRateRange: StrokeRateRange;
};

/** Pushes and pickups: the drum at 27, aiming for 26–28 as the boards show it. */
export const PUSH_RATE: RowingRate = {
  strokesPerMinute: 27,
  strokeRateRange: { low: 26, high: 28 },
};
/** Warm-ups, rests, easy rowing and cool-downs. The range is draft copy for the coach review (R17). */
export const EASY_RATE: RowingRate = {
  strokesPerMinute: 20,
  strokeRateRange: { low: 18, high: 22 },
};

/** One timed segment, with the rate and scene its type rows at; only pushes carry a heart-rate zone. */
export function timedSegment(
  type: TimedSegment['type'],
  durationMs: number,
  pushZone: HeartRateZone | null = null,
): TimedSegment {
  const isWork = isWorkSegment(type);
  return {
    type,
    durationMs,
    targetZone: type === 'push' ? pushZone : null,
    ...(isWork ? PUSH_RATE : EASY_RATE),
    scene: isWork ? 'work' : type === 'rest' ? 'rest' : 'easy',
  };
}

/** The 10-minute warm-up of every hard session, with two 20 s pickups (R10). */
export function warmUpWithPickups(): TimedSegment[] {
  return [
    timedSegment('warmUp', 5 * MINUTE),
    timedSegment('pickup', 20 * SECOND),
    timedSegment('warmUp', 100 * SECOND),
    timedSegment('pickup', 20 * SECOND),
    timedSegment('warmUp', 160 * SECOND),
  ];
}

/** A hard session (R10): the warm-up, `pushCount` pushes with rests between, then a 5-minute cool-down. */
export function hardSession(options: {
  readonly pushCount: number;
  readonly pushMs: number;
  readonly restMs: number;
  readonly pushZone: HeartRateZone;
  readonly coachingMode: CoachingMode;
}): SessionPlan {
  const work: TimedSegment[] = [];
  for (let push = 0; push < options.pushCount; push += 1) {
    if (push > 0) {
      work.push(timedSegment('rest', options.restMs));
    }
    work.push(timedSegment('push', options.pushMs, options.pushZone));
  }
  return {
    segments: [...warmUpWithPickups(), ...work, timedSegment('coolDown', 5 * MINUTE)],
    getSeatedHoldMs: DEFAULT_GET_SEATED_HOLD_MS,
    coachingMode: options.coachingMode,
  };
}
