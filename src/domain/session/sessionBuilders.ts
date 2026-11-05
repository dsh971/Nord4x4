import {
  DEFAULT_GET_SEATED_HOLD_MS,
  type CoachingMode,
  type HeartRateZone,
  type SessionPlan,
  type TimedSegment,
} from './sessionPlan';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
/** The drum's rate in pushes and pickups (26–28 spm on the boards). */
export const PUSH_STROKES_PER_MINUTE = 27;
/** The drum's rate in easy rowing, warm-ups, rests and cool-downs. */
export const EASY_STROKES_PER_MINUTE = 20;

/** One timed segment, with the rate and scene its type rows at; only pushes carry a heart-rate zone. */
export function timedSegment(
  type: TimedSegment['type'],
  durationMs: number,
  pushZone: HeartRateZone | null = null,
): TimedSegment {
  const isWork = type === 'push' || type === 'pickup';
  return {
    type,
    durationMs,
    targetZone: type === 'push' ? pushZone : null,
    strokesPerMinute: isWork ? PUSH_STROKES_PER_MINUTE : EASY_STROKES_PER_MINUTE,
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
