// The slice at the moments the boards draw, shared by the rowing tests and the dev states screen.
import { SLICE_PLAN } from '../../content/slicePlan';
import { ManualClock } from '../../domain/session/clock';
import { EASY_RATE } from '../../domain/session/sessionBuilders';
import { createSessionMachine, type SessionMachine } from '../../domain/session/sessionMachine';
import type { SessionPlan } from '../../domain/session/sessionPlan';
import type { HeartInput } from '../../features/rowing/gaugeModel';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
/** Board 3.2: push 2 of 3 with 1:48 left, 12:48 left in the session. */
export const PUSH_2_AT_1_48_LEFT = 17 * MINUTE + 12 * SECOND;
/** Board 3.3: the rest 10 s before push 2, as the war horn calls it. */
export const REST_10_S_BEFORE_PUSH_2 = 15 * MINUTE + 50 * SECOND;
export const PUSH_2_STARTS = 16 * MINUTE;

/** A real session machine `sessionMs` into the row, driven by a manual clock. */
export function machineAt(sessionMs: number, plan: SessionPlan = SLICE_PLAN): SessionMachine {
  const clock = new ManualClock();
  const machine = createSessionMachine(plan, clock);
  machine.startNow();
  clock.advanceBy(sessionMs);
  machine.advance();
  return machine;
}

/** A heart reading against a measured max of 184 bpm, the boards' sample rower. */
export function heart(bpm: number, overrides: Partial<HeartInput> = {}): HeartInput {
  return { bpm, maxHeartRate: 184, isMaxEstimated: false, isGlowing: false, ...overrides };
}

/** The slice coached by heart rate, as the fake HR trace rows it (KTD21). */
export const HR_SLICE: SessionPlan = { ...SLICE_PLAN, coachingMode: 'hr' };

/** Row freely: one open segment that counts up (R52). */
export const ROW_FREELY: SessionPlan = {
  segments: [
    {
      type: 'open',
      targetZone: null,
      ...EASY_RATE,
      scene: 'easy',
    },
  ],
  getSeatedHoldMs: 0,
  coachingMode: 'effort',
};

/** The slice's cool-down, with R61's line showing. */
export const COOL_DOWN = 27 * MINUTE;
