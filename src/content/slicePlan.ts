import { hardSession } from '../domain/session/sessionBuilders';
import type { SessionPlan } from '../domain/session/sessionPlan';

const MINUTE = 60_000;

/**
 * The one session the rowable slice rows (U7): week 3 of the Beginner voyage, 3×3′ with 3′ rests at
 * 85–90% of max HR (R10), 30 minutes, coached by effort since the slice has no strap.
 */
export const SLICE_PLAN: SessionPlan = hardSession({
  pushCount: 3,
  pushMs: 3 * MINUTE,
  restMs: 3 * MINUTE,
  pushZone: { lowPercentOfMax: 85, highPercentOfMax: 90 },
  coachingMode: 'effort',
});
