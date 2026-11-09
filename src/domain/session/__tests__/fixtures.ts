import { EASY_RATE, hardSession } from '../sessionBuilders';
import type { SessionEvent } from '../sessionMachine';
import type { CoachingMode, HeartRateZone, OpenSegment, SessionPlan } from '../sessionPlan';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;

export const PUSH_ZONE: HeartRateZone = { lowPercentOfMax: 85, highPercentOfMax: 95 };

/** Week 6: 4×4′ / 3′, 40 minutes. */
export function fourByFourPlan(coachingMode: CoachingMode = 'hr'): SessionPlan {
  return hardSession({
    pushCount: 4,
    pushMs: 4 * MINUTE,
    restMs: 3 * MINUTE,
    pushZone: PUSH_ZONE,
    coachingMode,
  });
}

/** Row freely: one open segment. */
export function rowFreelyPlan(): SessionPlan {
  const open: OpenSegment = {
    type: 'open',
    targetZone: null,
    ...EASY_RATE,
    scene: 'easy',
  };
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
