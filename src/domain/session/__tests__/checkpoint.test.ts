import { parseCheckpoint } from '../checkpoint';
import { ManualClock } from '../clock';
import { createSessionMachine, restoreSessionMachine } from '../sessionMachine';
import { describeEvent, fourByFourPlan, MINUTE, SECOND } from './fixtures';

const WALL_SAVED_MS = 1_800_000_000_000;

/** A machine `sessionMs` into a 4×4 row, and its checkpoint as it would come back from storage. */
function checkpointAt(sessionMs: number, options: { isPaused?: boolean } = {}) {
  const clock = new ManualClock();
  const machine = createSessionMachine(fourByFourPlan(), clock);
  machine.startNow();
  for (let moved = 0; moved < sessionMs; moved += SECOND) {
    clock.advanceBy(SECOND);
    machine.advance();
  }
  if (options.isPaused) {
    machine.pause('longPress');
  }
  const saved = machine.toCheckpoint(WALL_SAVED_MS);
  return parseCheckpoint(JSON.parse(JSON.stringify(saved)));
}

describe('restoreSessionMachine', () => {
  it('resumes a 30 s old checkpoint in the right segment with the right time left', () => {
    const checkpoint = checkpointAt(12 * MINUTE);
    // A fresh process: the monotonic clock starts from a new zero.
    const clock = new ManualClock(5_000);
    const machine = restoreSessionMachine({
      plan: fourByFourPlan(),
      clock,
      checkpoint,
      wallNowMs: WALL_SAVED_MS + 30 * SECOND,
    });

    expect(machine.snapshot()).toMatchObject({
      phase: 'rowing',
      segmentIndex: 5,
      segmentRemainingMs: 90 * SECOND,
      sessionElapsedMs: 12 * MINUTE + 30 * SECOND,
    });
    expect(machine.advance()).toEqual([]);
    clock.advanceBy(90 * SECOND);
    expect(machine.advance().map(describeEvent)).toEqual([
      '14:00 segmentEnded 5',
      '14:00 pushEnd 5',
      '14:00 segmentStarted 6',
    ]);
  });

  it('emits boundaries crossed while the app was gone, without replaying stale cues', () => {
    const checkpoint = checkpointAt(9 * MINUTE + 40 * SECOND);
    const machine = restoreSessionMachine({
      plan: fourByFourPlan(),
      clock: new ManualClock(),
      checkpoint,
      wallNowMs: WALL_SAVED_MS + 30 * SECOND,
    });

    expect(machine.advance().map(describeEvent)).toEqual([
      '10:00 segmentEnded 4',
      '10:00 segmentStarted 5',
    ]);
  });

  it('keeps a paused session paused, without counting the time away', () => {
    const checkpoint = checkpointAt(11 * MINUTE, { isPaused: true });
    const machine = restoreSessionMachine({
      plan: fourByFourPlan(),
      clock: new ManualClock(),
      checkpoint,
      wallNowMs: WALL_SAVED_MS + 10 * MINUTE,
    });

    expect(machine.snapshot()).toMatchObject({ phase: 'paused', sessionElapsedMs: 11 * MINUTE });
    expect(machine.resume().map(describeEvent)).toEqual(['11:00 resumed']);
  });

  it('ignores a wall clock that went backwards rather than rewinding the row', () => {
    const checkpoint = checkpointAt(12 * MINUTE);
    const machine = restoreSessionMachine({
      plan: fourByFourPlan(),
      clock: new ManualClock(),
      checkpoint,
      wallNowMs: WALL_SAVED_MS - 5 * MINUTE,
    });
    expect(machine.snapshot().sessionElapsedMs).toBe(12 * MINUTE);
  });

  it('rejects a checkpoint that lies beyond the end of the plan', () => {
    expect(() =>
      restoreSessionMachine({
        plan: fourByFourPlan(),
        clock: new ManualClock(),
        checkpoint: {
          version: 1,
          phase: 'rowing',
          sessionMs: 41 * MINUTE,
          emittedThroughMs: 40 * MINUTE,
          savedAtWallMs: 0,
        },
        wallNowMs: 0,
      }),
    ).toThrow(/plan/);
  });
});

describe('toCheckpoint', () => {
  it('has nothing to save before the row starts', () => {
    expect(createSessionMachine(fourByFourPlan(), new ManualClock()).toCheckpoint(0)).toBeNull();
  });
});

describe('parseCheckpoint', () => {
  it('rejects stored data that is not a checkpoint', () => {
    expect(() => parseCheckpoint(null)).toThrow(/checkpoint/);
    expect(() => parseCheckpoint({ version: 2, phase: 'rowing' })).toThrow(/version/);
    expect(() =>
      parseCheckpoint({
        version: 1,
        phase: 'complete',
        sessionMs: 0,
        emittedThroughMs: 0,
        savedAtWallMs: 0,
      }),
    ).toThrow(/phase/);
    expect(() =>
      parseCheckpoint({
        version: 1,
        phase: 'rowing',
        sessionMs: 'soon',
        emittedThroughMs: 0,
        savedAtWallMs: 0,
      }),
    ).toThrow(/sessionMs/);
  });
});
