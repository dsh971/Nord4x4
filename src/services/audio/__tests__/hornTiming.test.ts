import { HORN_LEAD_MS } from '../../../domain/session/sessionMachine';
import { LOOKAHEAD_MS } from '../drumSchedule';
import { DUCK_HOLD_MS } from '../signalSounds';
import { wavFileMs } from './wavFileMs';

describe('the war horn file against its lead (G6b)', () => {
  const hornMs = wavFileMs('war-horn.wav');

  it('ends before the push starts, so its drum gap is over by the start strike', () => {
    expect(hornMs).toBeLessThan(HORN_LEAD_MS);
  });

  it("leaves a gap to the start strike that the duck hold covers, so the music doesn't come up between", () => {
    const strikeScheduledMs = HORN_LEAD_MS - LOOKAHEAD_MS;
    expect(hornMs + DUCK_HOLD_MS).toBeGreaterThan(strikeScheduledMs);
  });
});
