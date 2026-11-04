import { createSeaLoop, createStrokeDrumLoop, createWarHorn } from '../tones';

const SAMPLE_RATE = 48_000;

function peakOf(samples: Float32Array): number {
  return samples.reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0);
}

function rmsOf(samples: Float32Array): number {
  return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
}

function seededRandom(): () => number {
  let seed = 1;
  return () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
}

describe('createStrokeDrumLoop', () => {
  it('lasts exactly one stroke at the given rate', () => {
    expect(createStrokeDrumLoop(SAMPLE_RATE, 27, seededRandom())).toHaveLength(
      Math.round((60 / 27) * SAMPLE_RATE),
    );
    expect(createStrokeDrumLoop(SAMPLE_RATE, 20, seededRandom())).toHaveLength(3 * SAMPLE_RATE);
  });

  it('hits once at the catch, then stays silent through the recovery', () => {
    const loop = createStrokeDrumLoop(SAMPLE_RATE, 27, seededRandom());
    expect(peakOf(loop.subarray(0, 0.1 * SAMPLE_RATE))).toBeGreaterThan(0.3);
    expect(peakOf(loop.subarray(0.6 * SAMPLE_RATE))).toBeLessThan(0.01);
    expect(peakOf(loop)).toBeLessThanOrEqual(1);
  });

  it('starts at silence so the loop seam does not click', () => {
    const loop = createStrokeDrumLoop(SAMPLE_RATE, 27, () => 0.99);
    expect(Math.abs(loop[0] ?? 1)).toBeLessThan(0.01);
  });

  it('rejects a stroke rate that is not a positive number', () => {
    expect(() => createStrokeDrumLoop(SAMPLE_RATE, 0)).toThrow(/stroke rate/);
    expect(() => createStrokeDrumLoop(SAMPLE_RATE, Number.NaN)).toThrow(/stroke rate/);
  });
});

describe('createSeaLoop', () => {
  it('fades both ends so the loop seam does not click', () => {
    const loop = createSeaLoop(SAMPLE_RATE, 4, () => 0.9);
    expect(loop).toHaveLength(4 * SAMPLE_RATE);
    expect(Math.abs(loop[0] ?? 1)).toBeLessThan(0.01);
    expect(Math.abs(loop[loop.length - 1] ?? 1)).toBeLessThan(0.01);
    expect(peakOf(loop)).toBeLessThanOrEqual(1);
  });

  it('is audible in the middle, not silence', () => {
    const loop = createSeaLoop(SAMPLE_RATE, 4, seededRandom());
    const middle = loop.subarray(SAMPLE_RATE, 3 * SAMPLE_RATE);
    expect(peakOf(middle)).toBeGreaterThan(0.05);
  });
});

describe('createWarHorn', () => {
  const horn = createWarHorn(SAMPLE_RATE, seededRandom());

  it('holds a long blast followed by its echo tail', () => {
    expect(horn).toHaveLength(Math.round(5.2 * SAMPLE_RATE));
    expect(rmsOf(horn.subarray(1 * SAMPLE_RATE, 2.5 * SAMPLE_RATE))).toBeGreaterThan(0.1);
  });

  it('starts and ends at silence so a one-shot does not click', () => {
    expect(Math.abs(horn[0] ?? 1)).toBeLessThan(0.01);
    expect(Math.abs(horn[horn.length - 1] ?? 1)).toBeLessThan(0.01);
    expect(peakOf(horn)).toBeGreaterThan(0.3);
    expect(peakOf(horn)).toBeLessThanOrEqual(1);
  });
});
