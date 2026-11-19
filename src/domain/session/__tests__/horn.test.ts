import { SLICE_PLAN } from '../../../content/slicePlan';
import { hornCueAtMs, isWorkCalled, warningStartsAtMs, workStartsOf } from '../sessionMachine';
import { segmentTimings } from '../sessionPlan';

describe('the warning and the war horn (R39, R40)', () => {
  it('shows the warning 10 s before a push or pickup, but never before the row starts', () => {
    expect(warningStartsAtMs(600_000)).toBe(590_000);
    expect(warningStartsAtMs(4_000)).toBe(0);
  });

  it('sounds the horn 6 s before, so its 5.2 s file and the quiet drum end before the push-start strike', () => {
    expect(hornCueAtMs(600_000)).toBe(594_000);
    expect(hornCueAtMs(4_000)).toBe(0);
  });

  it('calls a pickup the same way: from 4:50 until it starts at 5:00', () => {
    const workStarts = workStartsOf(segmentTimings(SLICE_PLAN));
    expect(workStarts.slice(0, 3)).toEqual([300_000, 420_000, 600_000]);
    expect(isWorkCalled(workStarts, 289_999)).toBe(false);
    expect(isWorkCalled(workStarts, 290_000)).toBe(true);
    expect(isWorkCalled(workStarts, 299_999)).toBe(true);
    expect(isWorkCalled(workStarts, 300_000)).toBe(false);
  });

  it('calls a push from its warning until the push starts, and not after', () => {
    const pushStarts = [600_000, 960_000];
    expect(isWorkCalled(pushStarts, 589_999)).toBe(false);
    expect(isWorkCalled(pushStarts, 590_000)).toBe(true);
    expect(isWorkCalled(pushStarts, 599_999)).toBe(true);
    expect(isWorkCalled(pushStarts, 600_000)).toBe(false);
    expect(isWorkCalled(pushStarts, 955_000)).toBe(true);
  });
});
