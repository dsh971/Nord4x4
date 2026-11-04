import { summarizeSession } from '../summary';
import { fourByFourPlan, MINUTE, rowFreelyPlan } from './fixtures';

describe('summarizeSession', () => {
  it('counts every push of a completed session', () => {
    expect(summarizeSession(fourByFourPlan(), 40 * MINUTE, 'completed')).toEqual({
      outcome: 'completed',
      rowedMs: 40 * MINUTE,
      plannedMs: 40 * MINUTE,
      pushesCompleted: 4,
      pushesPlanned: 4,
    });
  });

  it('counts a push as completed only once its last second is rowed', () => {
    const plan = fourByFourPlan();
    expect(summarizeSession(plan, 21 * MINUTE - 1, 'partlyRowed').pushesCompleted).toBe(1);
    expect(summarizeSession(plan, 21 * MINUTE, 'partlyRowed').pushesCompleted).toBe(2);
  });

  it('has no planned length or pushes for Row freely', () => {
    expect(summarizeSession(rowFreelyPlan(), 25 * MINUTE, 'partlyRowed')).toMatchObject({
      plannedMs: null,
      pushesCompleted: 0,
      pushesPlanned: 0,
    });
  });

  it('rejects a negative rowed time', () => {
    expect(() => summarizeSession(fourByFourPlan(), -1, 'partlyRowed')).toThrow(/rowed/);
  });
});
