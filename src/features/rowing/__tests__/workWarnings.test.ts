import { SLICE_PLAN } from '../../../content/slicePlan';
import { MINUTE, SECOND } from '../../../dev/rowingStates/sliceMoments';
import { segmentTimings } from '../../../domain/session/sessionPlan';
import { workWarningsFrom } from '../workWarnings';

const timings = segmentTimings(SLICE_PLAN);

describe('workWarningsFrom', () => {
  it('lists every push and pickup still to come, 10 s ahead of each, in order', () => {
    const warnings = workWarningsFrom(timings, 4 * MINUTE + 40 * SECOND);
    expect(warnings).toEqual([
      { id: 'pickup-1', secondsFromNow: 10, title: 'Pickup coming', body: 'Pickup starts in 10 s' },
      {
        id: 'pickup-2',
        secondsFromNow: 130,
        title: 'Pickup coming',
        body: 'Pickup starts in 10 s',
      },
      { id: 'push-1', secondsFromNow: 310, title: 'Ready oars', body: 'Push 1 starts in 10 s' },
      { id: 'push-2', secondsFromNow: 670, title: 'Ready oars', body: 'Push 2 starts in 10 s' },
      { id: 'push-3', secondsFromNow: 1030, title: 'Ready oars', body: 'Push 3 starts in 10 s' },
    ]);
  });

  it('skips a warning due in under a second', () => {
    const warnings = workWarningsFrom(timings, 4 * MINUTE + 49_500);
    expect(warnings[0]).toEqual({
      id: 'pickup-2',
      secondsFromNow: 120.5,
      title: 'Pickup coming',
      body: 'Pickup starts in 10 s',
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
