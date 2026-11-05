import type { HeartRateReading } from '../../sensors/heartRateSource';
import {
  EASE_OFF_AFTER_MS,
  INITIAL_EASE_OFF,
  observeHeartRate,
  type EaseOffState,
} from '../easeOff';

const MAX_HEART_RATE = 184;
const ABOVE = 176; // 95.7% of max
const AT_THRESHOLD = 174.8; // exactly 95% of max, which is not above it
const SETTLED = 140;

type Step = { readonly reading: HeartRateReading; readonly pushIndex: number | null };

/** Feeds readings in order; returns the final state and the times at which the bells rang. */
function feed(steps: readonly Step[], start: EaseOffState = INITIAL_EASE_OFF) {
  let state = start;
  const bellsAtMs: number[] = [];
  for (const { reading, pushIndex } of steps) {
    const result = observeHeartRate(state, reading, { maxHeartRate: MAX_HEART_RATE, pushIndex });
    state = result.state;
    if (result.shouldRingBells) {
      bellsAtMs.push(reading.atMs);
    }
  }
  return { state, bellsAtMs };
}

/** One sample a second at `bpm`, from `fromMs` through `toMs`. */
function samples(bpm: number, fromMs: number, toMs: number, pushIndex: number | null = 0): Step[] {
  const steps: Step[] = [];
  for (let atMs = fromMs; atMs <= toMs; atMs += 1000) {
    steps.push({ reading: { type: 'sample', bpm, atMs }, pushIndex });
  }
  return steps;
}

describe('ease-off (R36)', () => {
  it('glows and rings the bells once HR has stayed above 95% of max for 15 s', () => {
    const { state, bellsAtMs } = feed(samples(ABOVE, 0, EASE_OFF_AFTER_MS));
    expect(state.isGlowing).toBe(true);
    expect(bellsAtMs).toEqual([EASE_OFF_AFTER_MS]);
  });

  it('does nothing at 14 s above, or at exactly 95%', () => {
    expect(feed(samples(ABOVE, 0, 14_000)).state.isGlowing).toBe(false);
    expect(feed(samples(AT_THRESHOLD, 0, 30_000)).state.isGlowing).toBe(false);
  });

  it('rings once per push however long HR stays high, or dips and climbs again', () => {
    const { state, bellsAtMs } = feed([
      ...samples(ABOVE, 0, 60_000),
      ...samples(SETTLED, 61_000, 62_000),
      ...samples(ABOVE, 63_000, 120_000),
    ]);
    expect(state.isGlowing).toBe(true);
    expect(bellsAtMs).toEqual([15_000]);
  });

  it('does not ring again when the push ends with HR still high', () => {
    const { state, bellsAtMs } = feed([
      ...samples(ABOVE, 0, 30_000, 0),
      ...samples(ABOVE, 31_000, 60_000, null),
    ]);
    expect(state.isGlowing).toBe(true);
    expect(bellsAtMs).toEqual([15_000]);
  });

  it('clears the glow as soon as HR drops back', () => {
    const { state } = feed([...samples(ABOVE, 0, 20_000), ...samples(SETTLED, 21_000, 21_000)]);
    expect(state.isGlowing).toBe(false);
  });

  it('rings again in the next push', () => {
    const { bellsAtMs } = feed([
      ...samples(ABOVE, 0, 20_000, 0),
      ...samples(SETTLED, 21_000, 199_000, null),
      ...samples(ABOVE, 200_000, 220_000, 1),
    ]);
    expect(bellsAtMs).toEqual([15_000, 215_000]);
  });

  it('rings when HR climbs outside a push, such as in a warm-up pickup', () => {
    expect(feed(samples(ABOVE, 0, 20_000, null)).bellsAtMs).toEqual([15_000]);
  });

  it('starts the 15 s again after a strap dropout, and stops glowing while the strap is lost', () => {
    const dropout: Step = { reading: { type: 'dropout', atMs: 10_500 }, pushIndex: 0 };
    const beforeGlow = feed([
      ...samples(ABOVE, 0, 10_000),
      dropout,
      ...samples(ABOVE, 11_000, 25_000),
    ]);
    expect(beforeGlow.bellsAtMs).toEqual([]);
    const whileGlowing = feed([
      ...samples(ABOVE, 0, 20_000),
      { reading: { type: 'dropout', atMs: 20_500 }, pushIndex: 0 },
    ]);
    expect(whileGlowing.state.isGlowing).toBe(false);
  });

  it('does not count a gap with no readings as HR staying high', () => {
    const { state, bellsAtMs } = feed([...samples(ABOVE, 0, 0), ...samples(ABOVE, 60_000, 60_000)]);
    expect(state.isGlowing).toBe(false);
    expect(bellsAtMs).toEqual([]);
  });

  it('refuses a max heart rate that is not a positive number', () => {
    const reading: HeartRateReading = { type: 'sample', bpm: 150, atMs: 0 };
    for (const maxHeartRate of [0, -1, Number.NaN]) {
      expect(() =>
        observeHeartRate(INITIAL_EASE_OFF, reading, { maxHeartRate, pushIndex: 0 }),
      ).toThrow('Max heart rate');
    }
  });
});
