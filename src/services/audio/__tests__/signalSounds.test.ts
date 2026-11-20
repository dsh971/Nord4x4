import { drumGapMs, SIGNAL_SOUNDS } from '../signalSounds';

const WAR_HORN_FILE_MS = 5_200;

describe('signal sounds', () => {
  it('starts and ends a pickup with the push sounds, so a pickup sounds like a push in miniature', () => {
    expect(SIGNAL_SOUNDS.pickupStart).toEqual(SIGNAL_SOUNDS.pushStart);
    expect(SIGNAL_SOUNDS.pickupEnd).toEqual(SIGNAL_SOUNDS.pushEnd);
  });

  it('ends work with the gong, so the war horn only ever means work coming', () => {
    expect(SIGNAL_SOUNDS.pushEnd.sound).toBe('end-gong');
    const hornSignals = Object.entries(SIGNAL_SOUNDS).filter(
      ([, signal]) => signal.sound === 'war-horn',
    );
    expect(hornSignals.map(([kind]) => kind)).toEqual(['horn']);
  });
});

describe('drum gap', () => {
  it('lasts as long as a single-strike signal, echo tail included', () => {
    expect(drumGapMs(SIGNAL_SOUNDS.horn, WAR_HORN_FILE_MS)).toBe(WAR_HORN_FILE_MS);
  });

  it('runs to the end of the third ease-off bell, not the first (sound spec: 3.0 s)', () => {
    expect(drumGapMs(SIGNAL_SOUNDS.easeOff, 1_800)).toBe(3_000);
  });
});
