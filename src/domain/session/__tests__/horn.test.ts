import { SLICE_PLAN } from '../../../content/slicePlan';
import {
  HORN_LEAD_MS,
  hornCueAtMs,
  isWarningBannerUp,
  isWorkCalled,
  WARNING_GAP_MS,
  WARNING_LEAD_MS,
  warningBannerWorkAt,
  warningStartsAtMs,
  workStartsOf,
} from '../sessionMachine';
import { segmentTimings, type SessionPlan, type TimedSegment } from '../sessionPlan';

function segment(type: TimedSegment['type'], durationMs: number): TimedSegment {
  return {
    type,
    durationMs,
    targetZone: null,
    strokesPerMinute: 20,
    strokeRateRange: { low: 18, high: 22 },
    scene: 'easy',
  };
}

describe('the warning and the war horn (R39, R40)', () => {
  it('shows the warning 13 s before a push or pickup, but never before the row starts', () => {
    expect(warningStartsAtMs(600_000)).toBe(587_000);
    expect(warningStartsAtMs(4_000)).toBe(0);
  });

  it('sounds the horn 6 s before, so its 5.2 s file and the quiet drum end before the push-start strike', () => {
    expect(hornCueAtMs(600_000)).toBe(594_000);
    expect(hornCueAtMs(4_000)).toBe(0);
  });

  it('calls a pickup the same way: from 4:47 until it starts at 5:00', () => {
    const workStarts = workStartsOf(segmentTimings(SLICE_PLAN));
    expect(workStarts.slice(0, 3)).toEqual([300_000, 420_000, 600_000]);
    expect(isWorkCalled(workStarts, 286_999)).toBe(false);
    expect(isWorkCalled(workStarts, 287_000)).toBe(true);
    expect(isWorkCalled(workStarts, 299_999)).toBe(true);
    expect(isWorkCalled(workStarts, 300_000)).toBe(false);
  });

  it('calls a push from its warning until the push starts, and not after', () => {
    const pushStarts = [600_000, 960_000];
    expect(isWorkCalled(pushStarts, 586_999)).toBe(false);
    expect(isWorkCalled(pushStarts, 587_000)).toBe(true);
    expect(isWorkCalled(pushStarts, 599_999)).toBe(true);
    expect(isWorkCalled(pushStarts, 600_000)).toBe(false);
    expect(isWorkCalled(pushStarts, 955_000)).toBe(true);
  });

  it('keeps the warning banner up from 13 s until 3 s before the start, then clears it', () => {
    expect(isWarningBannerUp(600_000, 586_999)).toBe(false);
    expect(isWarningBannerUp(600_000, 587_000)).toBe(true);
    expect(isWarningBannerUp(600_000, 596_999)).toBe(true);
    expect(isWarningBannerUp(600_000, 597_000)).toBe(false);
    expect(isWarningBannerUp(600_000, 599_999)).toBe(false);
  });

  it('sounds the horn while its banner is still up, so the horn keeps its visual twin (R51)', () => {
    expect(WARNING_GAP_MS).toBeLessThan(HORN_LEAD_MS);
    expect(HORN_LEAD_MS).toBeLessThan(WARNING_LEAD_MS);
  });

  it("shows the next work's warning even while the work before it is in its 3 s gap", () => {
    const closeWork: SessionPlan = {
      segments: [
        segment('easy', 100_000),
        segment('push', 4_000),
        segment('rest', 4_000),
        segment('push', 60_000),
      ],
      getSeatedHoldMs: 0,
      coachingMode: 'effort',
    };
    const timings = segmentTimings(closeWork);
    expect(warningBannerWorkAt(timings, 96_000)?.startMs).toBe(100_000);
    expect(warningBannerWorkAt(timings, 98_000)?.startMs).toBe(108_000);
  });
});
