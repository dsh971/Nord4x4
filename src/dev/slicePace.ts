import { systemClock } from '../domain/session/clock';
import type { SessionPlan } from '../domain/session/sessionPlan';
import type { RowingPace } from '../features/rowing/useRowingSession';
import type { SpedUpClock } from './spedUpClock';

/**
 * The fastest the slice may row. The session machine drops a cue more than 2 s late (STALE_CUE_MS),
 * so at N× a gap of more than 2000 / N ms between screen ticks loses one without a word. At 10× that
 * is 200 ms: twice the 100 ms tick, enough for the walkthrough, which waits on labels that last, not
 * on the short notices a long stall can drop.
 */
export const MAX_SLICE_SPEED = 10;

/** How the slice route rows: its pace and speed, or why it can't row at all. */
export type SlicePace =
  { readonly pace: RowingPace; readonly speed: number } | { readonly error: string };

const REAL_TIME: SlicePace = { pace: { clock: systemClock, isSoundOn: true }, speed: 1 };

/**
 * Reads the slice route's `?speed=`: real time with sound when absent or 1; otherwise, in test mode
 * only, a whole number up to MAX_SLICE_SPEED, rowed silent, since the audio clock can't speed up.
 */
export function chooseSlicePace(speedParam: string | undefined, isTestModeOn: boolean): SlicePace {
  if (speedParam === undefined) {
    return REAL_TIME;
  }
  if (__DEV__ && isTestModeOn) {
    // Exact digits only, as with the test-mode flag: "1e1" or " 5" is a typo to surface, not guess at.
    const speed = /^\d+$/.test(speedParam) ? Number(speedParam) : Number.NaN;
    if (!(speed >= 1 && speed <= MAX_SLICE_SPEED)) {
      return {
        error: `speed must be a whole number from 1 to ${MAX_SLICE_SPEED}; got "${speedParam}"`,
      };
    }
    if (speed === 1) {
      return REAL_TIME;
    }
    // Loaded only here, so release builds, where this branch folds away, leave the fast clock out.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- an import would always ship it
    const fast = require('./spedUpClock') as { SpedUpClock: typeof SpedUpClock };
    return { pace: { clock: new fast.SpedUpClock(systemClock, speed), isSoundOn: false }, speed };
  }
  return { error: 'speed works only in test mode: start Metro with npm run start:test' };
}

/**
 * The plan to row at `speed`: Get seated's hold stretched by the same factor, so it still lasts its
 * real time and the walkthrough can tap Start now. The row itself, from the count-in on, stays fast.
 */
export function planAtSpeed(plan: SessionPlan, speed: number): SessionPlan {
  return speed === 1 ? plan : { ...plan, getSeatedHoldMs: plan.getSeatedHoldMs * speed };
}
