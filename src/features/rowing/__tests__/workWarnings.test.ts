import { SLICE_PLAN } from '../../../content/slicePlan';
import { MINUTE, SECOND } from '../../../dev/rowingStates/sliceMoments';
import { segmentTimings } from '../../../domain/session/sessionPlan';
import { stillRowingNotice, workWarningsFrom } from '../workWarnings';

const timings = segmentTimings(SLICE_PLAN);

describe('workWarningsFrom', () => {
  it('lists every push and pickup still to come, 10 s ahead of each, in order', () => {
    const warnings = workWarningsFrom(timings, 4 * MINUTE + 40 * SECOND);
    expect(warnings).toEqual([
      {
        id: 'pickup-1',
        secondsFromNow: 10,
        title: 'Pickup coming',
        body: 'Pickup starts in 10 s',
        sound: 'warHorn',
      },
      {
        id: 'pickup-2',
        secondsFromNow: 130,
        title: 'Pickup coming',
        body: 'Pickup starts in 10 s',
        sound: 'warHorn',
      },
      {
        id: 'push-1',
        secondsFromNow: 310,
        title: 'Ready oars',
        body: 'Push 1 starts in 10 s',
        sound: 'warHorn',
      },
      {
        id: 'push-2',
        secondsFromNow: 670,
        title: 'Ready oars',
        body: 'Push 2 starts in 10 s',
        sound: 'warHorn',
      },
      {
        id: 'push-3',
        secondsFromNow: 1030,
        title: 'Ready oars',
        body: 'Push 3 starts in 10 s',
        sound: 'warHorn',
      },
    ]);
  });

  it('skips a warning due in under a second', () => {
    const warnings = workWarningsFrom(timings, 4 * MINUTE + 49_500);
    expect(warnings[0]).toEqual({
      id: 'pickup-2',
      secondsFromNow: 120.5,
      title: 'Pickup coming',
      body: 'Pickup starts in 10 s',
      sound: 'warHorn',
    });
  });

  it('counts from a negative session time during Get seated, since the row starts by itself', () => {
    expect(workWarningsFrom(timings, -15 * SECOND)[0]).toMatchObject({
      id: 'pickup-1',
      secondsFromNow: 305,
    });
  });

  it('has nothing to warn of in the cool-down', () => {
    expect(workWarningsFrom(timings, 26 * MINUTE)).toEqual([]);
  });
});

describe('stillRowingNotice', () => {
  it('says, silently and a second after leaving, that the row goes on, with the time left on leaving', () => {
    expect(stillRowingNotice(25 * MINUTE + 10 * SECOND)).toEqual({
      id: 'still-rowing',
      secondsFromNow: 1,
      title: 'Row still going',
      body: 'Session · 25:10 left · Open for sound',
      sound: 'none',
    });
  });

  it('gives no time for a row with no end', () => {
    expect(stillRowingNotice(null).body).toBe('Open for sound');
  });
});
