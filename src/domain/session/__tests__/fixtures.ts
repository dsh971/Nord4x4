import type { SessionEvent } from '../sessionMachine';
import type {
  CoachingMode,
  HeartRateZone,
  OpenSegment,
  SessionPlan,
  TimedSegment,
} from '../sessionPlan';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;

const PUSH_ZONE: HeartRateZone = { lowPercentOfMax: 85, highPercentOfMax: 95 };

/** A warm-up stretch, pickup, push, rest or cool-down of the given length. */
export function segment(type: TimedSegment['type'], durationMs: number): TimedSegment {
  const isWork = type === 'push' || type === 'pickup';
  return {
    type,
    durationMs,
    targetZone: type === 'push' ? PUSH_ZONE : null,
    strokesPerMinute: isWork ? 27 : 20,
    scene: isWork ? 'work' : type === 'rest' ? 'rest' : 'easy',
  };
}

/** A 10-minute warm-up with two 20 s pickups, as R10 describes. */
export function warmUpWithPickups(): TimedSegment[] {
  return [
    segment('warmUp', 5 * MINUTE),
    segment('pickup', 20 * SECOND),
    segment('warmUp', 100 * SECOND),
    segment('pickup', 20 * SECOND),
    segment('warmUp', 160 * SECOND),
  ];
}

/** A hard session: warm-up, `pushCount` pushes with rests between, then a 5-minute cool-down. */
export function intervalPlan(options: {
  pushCount: number;
  pushMs: number;
  restMs: number;
  coachingMode?: CoachingMode;
}): SessionPlan {
  const work: TimedSegment[] = [];
  for (let push = 0; push < options.pushCount; push += 1) {
    if (push > 0) {
      work.push(segment('rest', options.restMs));
    }
    work.push(segment('push', options.pushMs));
  }
  return {
    segments: [...warmUpWithPickups(), ...work, segment('coolDown', 5 * MINUTE)],
    getSeatedHoldMs: 20 * SECOND,
    coachingMode: options.coachingMode ?? 'hr',
  };
}

/** Week 6: 4×4′ / 3′, 40 minutes. */
export function fourByFourPlan(coachingMode: CoachingMode = 'hr'): SessionPlan {
  return intervalPlan({ pushCount: 4, pushMs: 4 * MINUTE, restMs: 3 * MINUTE, coachingMode });
}

/** Row freely: one open segment. */
export function rowFreelyPlan(): SessionPlan {
  const open: OpenSegment = { type: 'open', targetZone: null, strokesPerMinute: 20, scene: 'easy' };
  return { segments: [open], getSeatedHoldMs: 20 * SECOND, coachingMode: 'hr' };
}

/** Formats a timeline time as a signed m:ss, so event lists read like a session log. */
export function formatTime(ms: number): string {
  const sign = ms < 0 ? '-' : '';
  const totalSeconds = Math.round(Math.abs(ms) / SECOND);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${sign}${Math.floor(totalSeconds / 60)}:${seconds}`;
}

/** One line per event: its time, its type, and the cue or segment it concerns. */
export function describeEvent(event: SessionEvent): string {
  const time = formatTime(event.atMs);
  switch (event.type) {
    case 'cueDue':
      return event.cue.kind === 'countIn'
        ? `${time} countIn ${event.cue.count}`
        : `${time} ${event.cue.kind} ${event.cue.segmentIndex}`;
    case 'segmentStarted':
    case 'segmentEnded':
      return `${time} ${event.type} ${event.segmentIndex}`;
    case 'paused':
      return `${time} paused ${event.reason}`;
    case 'resumed':
    case 'sessionCompleted':
    case 'sessionEndedEarly':
      return `${time} ${event.type}`;
  }
}
