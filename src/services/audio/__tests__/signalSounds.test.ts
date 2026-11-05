import { drumGapMs, SIGNAL_SOUNDS } from '../signalSounds';

describe('drum gap', () => {
  it('lasts as long as a single-strike signal, echo tail included', () => {
    expect(drumGapMs(SIGNAL_SOUNDS.horn, 5_200)).toBe(5_200);
  });

  it('runs to the end of the third ease-off bell, not the first (sound spec: 3.0 s)', () => {
    expect(drumGapMs(SIGNAL_SOUNDS.easeOff, 1_800)).toBe(3_000);
  });
});
