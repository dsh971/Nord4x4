import { SLICE_PLAN } from '../../../content/slicePlan';
import { MAX_SLICE_SPEED } from '../../../dev/slicePace';
import { SpedUpClock } from '../../../dev/spedUpClock';
import { PUSH_2_STARTS } from '../../../dev/rowingStates/sliceMoments';
import { ManualClock, type MonotonicClock } from '../../../domain/session/clock';
import { plannedLengthMs } from '../../../domain/session/sessionPlan';
import { RowingSession } from '../rowingSession';

/** Each banner as it first appears, in order: what a rower watching the screen would see. */
function bannersSeen(clock: MonotonicClock, advance: (tick: number) => void): string[] {
  const session = new RowingSession(SLICE_PLAN, clock, null);
  session.startNow();
  const seen: string[] = [];
  let shown: string | null = null;
  for (let tick = 0; session.tick().summary === null; tick += 1) {
    advance(tick);
    const text = session.tick().banner?.text ?? null;
    if (text !== null && text !== shown) {
      seen.push(text);
    }
    shown = text;
  }
  return seen;
}

/** The slice on a sped-up clock, with screen ticks arriving 100–150 ms apart, as a busy phone delivers them. */
function bannersAtSpeed(speed: number): string[] {
  const base = new ManualClock();
  const fast = new SpedUpClock(base, speed);
  return bannersSeen(fast, (tick) => base.advanceBy(100 + ((tick * 37) % 51)));
}

describe('the slice on a sped-up clock (G7a)', () => {
  const realTime = (() => {
    const clock = new ManualClock();
    return bannersSeen(clock, () => clock.advanceBy(100));
  })();

  it('shows every banner of the real-time row, in order, at the top speed', () => {
    expect(plannedLengthMs(SLICE_PLAN)).toBeGreaterThan(20 * 60_000);
    expect(realTime).toEqual(
      expect.arrayContaining(['Pickup coming', 'Ready oars', 'Pull', 'Rest']),
    );
    expect(bannersAtSpeed(MAX_SLICE_SPEED)).toEqual(realTime);
  });

  it('loses "Pull" and "Rest" notices at 20×, which is why the speed stops at 10', () => {
    const notices = (banners: string[]) =>
      banners.filter((text) => text === 'Pull' || text === 'Rest');
    expect(notices(bannersAtSpeed(20)).length).toBeLessThan(notices(realTime).length);
  });

  it.each([
    [290, 'Pull'],
    [310, null],
  ])(
    'at 10×, a %i ms stall from 1 s before the push start shows %p: a cue over 2 s late is dropped',
    (stallMs, banner) => {
      const base = new ManualClock();
      const session = new RowingSession(SLICE_PLAN, new SpedUpClock(base, MAX_SLICE_SPEED), null);
      session.startNow();
      let lastMs = session.tick().sessionMs;
      while (lastMs < PUSH_2_STARTS - 1_000) {
        base.advanceBy(100);
        lastMs = session.tick().sessionMs;
      }
      expect(lastMs).toBe(PUSH_2_STARTS - 1_000);
      base.advanceBy(stallMs);
      expect(session.tick().banner?.text ?? null).toBe(banner);
    },
  );
});
