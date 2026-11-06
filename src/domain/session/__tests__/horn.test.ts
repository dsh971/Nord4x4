import { hornCueAtMs, isHornCalling } from '../sessionMachine';

describe('the war horn (R40: "Push in 10 s")', () => {
  it('sounds 10 s before a push, but never before the row starts', () => {
    expect(hornCueAtMs(600_000)).toBe(590_000);
    expect(hornCueAtMs(4_000)).toBe(0);
  });

  it('calls a push from its cue until the push starts, and not after', () => {
    const pushStarts = [600_000, 960_000];
    expect(isHornCalling(pushStarts, 589_999)).toBe(false);
    expect(isHornCalling(pushStarts, 590_000)).toBe(true);
    expect(isHornCalling(pushStarts, 599_999)).toBe(true);
    expect(isHornCalling(pushStarts, 600_000)).toBe(false);
    expect(isHornCalling(pushStarts, 955_000)).toBe(true);
  });
});
