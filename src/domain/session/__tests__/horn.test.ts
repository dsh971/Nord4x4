import { hornCueAtMs, isPushCalled, warningStartsAtMs } from '../sessionMachine';

describe('the warning and the war horn (R39, R40)', () => {
  it('shows the warning 10 s before a push or pickup, but never before the row starts', () => {
    expect(warningStartsAtMs(600_000)).toBe(590_000);
    expect(warningStartsAtMs(4_000)).toBe(0);
  });

  it('sounds the horn 6 s before, so its 5.2 s file and the quiet drum end before the push-start strike', () => {
    expect(hornCueAtMs(600_000)).toBe(594_000);
    expect(hornCueAtMs(4_000)).toBe(0);
  });

  it('calls a push from its warning until the push starts, and not after', () => {
    const pushStarts = [600_000, 960_000];
    expect(isPushCalled(pushStarts, 589_999)).toBe(false);
    expect(isPushCalled(pushStarts, 590_000)).toBe(true);
    expect(isPushCalled(pushStarts, 599_999)).toBe(true);
    expect(isPushCalled(pushStarts, 600_000)).toBe(false);
    expect(isPushCalled(pushStarts, 955_000)).toBe(true);
  });
});
