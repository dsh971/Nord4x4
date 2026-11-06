import type { HeartRateReading } from '../domain/sensors/heartRateSource';
import { pushPositionAt, segmentTimings, type SessionPlan } from '../domain/session/sessionPlan';

const SECOND = 1000;
// The boards' sample rower: max 184 bpm, so the slice's 85–90% push target is 156–166.
export const FAKE_MAX_HEART_RATE = 184;
// Push 2 climbs past 95% of max (174.8) for 30 s, a minute in, so the ease-off fires once.
const EASE_OFF_PUSH = 1;
const OVER_FROM_MS = 60 * SECOND;
const OVER_UNTIL_MS = 90 * SECOND;

/**
 * A pretend strap for the slice, keyed to session time so it pauses with the row: easy rowing near
 * 115, pickups to 140, pushes ramping to about 162, push 2 running over 95% of max for 30 s, and rests
 * settling back. It drives the gauge's heart-rate mode and the ease-off on the phone (dev only).
 */
export function fakeHeartRate(plan: SessionPlan): (sessionMs: number) => HeartRateReading | null {
  const timings = segmentTimings(plan);
  return (sessionMs) => {
    const index = timings.findIndex(
      ({ startMs, endMs }) => sessionMs >= startMs && sessionMs < (endMs ?? Infinity),
    );
    const timing = timings[index];
    if (timing === undefined) {
      return null;
    }
    const intoMs = sessionMs - timing.startMs;
    const bpm = ((): number => {
      switch (timing.segment.type) {
        case 'push': {
          const ramp = 130 + 32 * Math.min(1, intoMs / (90 * SECOND));
          const isOver =
            pushPositionAt(plan, index)?.index === EASE_OFF_PUSH &&
            intoMs >= OVER_FROM_MS &&
            intoMs < OVER_UNTIL_MS;
          return isOver ? 178 : ramp;
        }
        case 'pickup':
          return 140;
        case 'rest':
          return 125 + 37 * Math.exp(-intoMs / (40 * SECOND));
        default:
          return 115;
      }
    })();
    return { type: 'sample', bpm: Math.round(bpm), atMs: sessionMs };
  };
}
