import { SLICE_PLAN } from '../../content/slicePlan';
import { systemClock } from '../../domain/session/clock';
import { chooseSlicePace, MAX_SLICE_SPEED, planAtSpeed } from '../slicePace';
import { SpedUpClock } from '../spedUpClock';

const REAL_TIME = { pace: { clock: systemClock, isSoundOn: true }, speed: 1 };

describe('the slice route speed', () => {
  it('rows in real time with sound when no speed is given, test mode or not', () => {
    expect(chooseSlicePace(undefined, false)).toEqual(REAL_TIME);
    expect(chooseSlicePace(undefined, true)).toEqual(REAL_TIME);
  });

  it('rows 10× faster and silent in test mode', () => {
    expect(chooseSlicePace('10', true)).toEqual({
      pace: { clock: expect.any(SpedUpClock), isSoundOn: false },
      speed: 10,
    });
  });

  it('rows a speed of 1 on the real clock, with sound', () => {
    expect(chooseSlicePace('1', true)).toEqual(REAL_TIME);
  });

  it('refuses a speed outside test mode rather than row at the wrong speed', () => {
    expect(chooseSlicePace('10', false)).toEqual({
      error: 'speed works only in test mode: start Metro with npm run start:test',
    });
  });

  it.each(['11', '20', '0', '2.5', 'fast', '', '1e1', '0x5', ' 5', '+3', '10.0'])(
    'refuses a speed of "%s", naming the limit',
    (speed) => {
      expect(chooseSlicePace(speed, true)).toEqual({
        error: `speed must be a whole number from 1 to ${MAX_SLICE_SPEED}; got "${speed}"`,
      });
    },
  );
});

describe('the slice plan at speed', () => {
  it('stretches Get seated by the speed, so it lasts its real time', () => {
    expect(planAtSpeed(SLICE_PLAN, 10)).toEqual({
      ...SLICE_PLAN,
      getSeatedHoldMs: SLICE_PLAN.getSeatedHoldMs * 10,
    });
    expect(planAtSpeed(SLICE_PLAN, 1)).toBe(SLICE_PLAN);
  });
});
