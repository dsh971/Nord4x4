import { ManualClock } from '../clock';
import { createSessionMachine, type SessionEvent, type SessionMachine } from '../sessionMachine';
import {
  describeEvent,
  fourByFourPlan,
  intervalPlan,
  MINUTE,
  rowFreelyPlan,
  SECOND,
  segment,
} from './fixtures';

/** Moves the clock in steps up to `totalMs`, advancing the machine after each step. */
function runFor(
  machine: SessionMachine,
  clock: ManualClock,
  totalMs: number,
  stepMs = SECOND,
): SessionEvent[] {
  const events: SessionEvent[] = [];
  for (let moved = 0; moved < totalMs; moved += stepMs) {
    clock.advanceBy(Math.min(stepMs, totalMs - moved));
    events.push(...machine.advance());
  }
  return events;
}

/** A machine that has finished Get seated and is `sessionMs` into the row. */
function rowingAt(plan = fourByFourPlan(), sessionMs = 0) {
  const clock = new ManualClock(1_000);
  const machine = createSessionMachine(plan, clock);
  machine.startNow();
  runFor(machine, clock, sessionMs);
  return { clock, machine };
}

describe('Get seated', () => {
  it('starts the row after the 20 s hold, counting in the last five seconds (AE9)', () => {
    const clock = new ManualClock();
    const machine = createSessionMachine(fourByFourPlan(), clock);

    expect(machine.snapshot()).toMatchObject({
      phase: 'getSeated',
      getSeatedRemainingMs: 20 * SECOND,
    });
    expect(runFor(machine, clock, 20 * SECOND).map(describeEvent)).toEqual([
      '-0:05 countIn 5',
      '-0:04 countIn 4',
      '-0:03 countIn 3',
      '-0:02 countIn 2',
      '-0:01 countIn 1',
      '0:00 segmentStarted 0',
    ]);
    expect(machine.snapshot()).toMatchObject({ phase: 'rowing', segmentIndex: 0 });
  });

  it('starts at once on "Start now", with no count-in left to play (AE9)', () => {
    const clock = new ManualClock();
    const machine = createSessionMachine(fourByFourPlan(), clock);
    runFor(machine, clock, 3 * SECOND);

    expect(machine.startNow().map(describeEvent)).toEqual(['0:00 segmentStarted 0']);
    expect(runFor(machine, clock, 30 * SECOND)).toEqual([]);
    expect(machine.snapshot()).toMatchObject({ phase: 'rowing', sessionElapsedMs: 30 * SECOND });
  });

  it('cannot be paused: there is no row to pause yet', () => {
    const machine = createSessionMachine(fourByFourPlan(), new ManualClock());
    expect(() => machine.pause('longPress')).toThrow(/rowing/);
  });
});

describe('cues', () => {
  it('sounds the horn 10 s before each push, never for a warm-up pickup, and heave as each push starts', () => {
    const { clock, machine } = rowingAt();
    const cues = runFor(machine, clock, 40 * MINUTE)
      .filter((event) => event.type === 'cueDue')
      .map(describeEvent);

    expect(cues).toEqual([
      '9:50 horn 5',
      '10:00 heave 5',
      '14:00 pushEnd 5',
      '16:50 horn 7',
      '17:00 heave 7',
      '21:00 pushEnd 7',
      '23:50 horn 9',
      '24:00 heave 9',
      '28:00 pushEnd 9',
      '30:50 horn 11',
      '31:00 heave 11',
      '35:00 pushEnd 11',
    ]);
  });

  it('calls "Hold!" 90 s into each push in effort mode, and never in HR mode (R30)', () => {
    const plan = (coachingMode: 'hr' | 'effort') =>
      intervalPlan({ pushCount: 3, pushMs: 3 * MINUTE, restMs: 3 * MINUTE, coachingMode });
    const holdCues = (mode: 'hr' | 'effort') => {
      const { clock, machine } = rowingAt(plan(mode));
      return runFor(machine, clock, 30 * MINUTE)
        .filter((event) => event.type === 'cueDue' && event.cue.kind === 'hold')
        .map(describeEvent);
    };

    expect(holdCues('effort')).toEqual(['11:30 hold 5', '17:30 hold 7', '23:30 hold 9']);
    expect(holdCues('hr')).toEqual([]);
  });

  it('lists the cues due soon, so audio can schedule them ahead (KTD5)', () => {
    const { machine } = rowingAt(fourByFourPlan(), 9 * MINUTE + 45 * SECOND);
    expect(machine.upcomingCues(20 * SECOND).map(describeEvent)).toEqual([
      '9:50 horn 5',
      '10:00 heave 5',
    ]);
  });
});

describe('pause', () => {
  it('pauses mid-push and freezes the time left (AE10)', () => {
    const { clock, machine } = rowingAt(fourByFourPlan(), 11 * MINUTE);

    expect(machine.pause('longPress').map(describeEvent)).toEqual(['11:00 paused longPress']);
    clock.advanceBy(60 * SECOND);
    expect(machine.advance()).toEqual([]);
    expect(machine.snapshot()).toMatchObject({
      phase: 'paused',
      segmentIndex: 5,
      segmentRemainingMs: 3 * MINUTE,
      sessionRemainingMs: 29 * MINUTE,
    });
  });

  it('cancels pending cues, and a 60 s pause moves the session end 60 s later', () => {
    const { clock, machine } = rowingAt(fourByFourPlan(), 13 * MINUTE + 55 * SECOND);
    expect(machine.upcomingCues(10 * SECOND).map(describeEvent)).toEqual(['14:00 pushEnd 5']);

    machine.pause('interruption');
    expect(machine.upcomingCues(10 * SECOND)).toEqual([]);
    clock.advanceBy(60 * SECOND);
    expect(machine.resume().map(describeEvent)).toEqual(['13:55 resumed']);
    expect(machine.snapshot()).toMatchObject({ segmentRemainingMs: 5 * SECOND });

    const rest = runFor(machine, clock, 27 * MINUTE).map(describeEvent);
    expect(rest).toContain('14:00 pushEnd 5');
    expect(rest.at(-1)).toBe('40:00 sessionCompleted');
  });

  it('ends the session exactly 40 minutes of rowing after it began, however long the pause', () => {
    const { clock, machine } = rowingAt(fourByFourPlan(), 11 * MINUTE);
    machine.pause('longPress');
    clock.advanceBy(60 * SECOND);
    machine.resume();

    const events = runFor(machine, clock, 29 * MINUTE - SECOND);
    expect(events.map(describeEvent)).not.toContain('40:00 sessionCompleted');
    expect(runFor(machine, clock, SECOND).map(describeEvent)).toEqual([
      '40:00 segmentEnded 12',
      '40:00 sessionCompleted',
    ]);
  });
});

describe('ending early', () => {
  it('ends from pause as Partly rowed, with no sessionCompleted (AE11)', () => {
    const { clock, machine } = rowingAt(fourByFourPlan(), 20 * MINUTE);
    machine.pause('longPress');

    const [ended, ...others] = machine.endSession();
    expect(others).toEqual([]);
    expect(ended).toEqual({
      type: 'sessionEndedEarly',
      atMs: 20 * MINUTE,
      summary: {
        outcome: 'partlyRowed',
        rowedMs: 20 * MINUTE,
        plannedMs: 40 * MINUTE,
        pushesCompleted: 1,
        pushesPlanned: 4,
      },
    });
    expect(runFor(machine, clock, 30 * MINUTE)).toEqual([]);
    expect(machine.snapshot().phase).toBe('partlyRowed');
  });

  it('only ends from the pause sheet', () => {
    const { machine } = rowingAt(fourByFourPlan(), MINUTE);
    expect(() => machine.endSession()).toThrow(/paused/);
  });
});

describe('clock jumps', () => {
  it('emits each skipped boundary once, in order, and drops cues more than 2 s stale', () => {
    const { clock, machine } = rowingAt(fourByFourPlan(), 9 * MINUTE + 40 * SECOND);

    clock.advanceBy(95 * SECOND);
    expect(machine.advance().map(describeEvent)).toEqual([
      '10:00 segmentEnded 4',
      '10:00 segmentStarted 5',
    ]);
    expect(machine.advance()).toEqual([]);
  });

  it('still plays a cue that is less than 2 s late', () => {
    const { clock, machine } = rowingAt(fourByFourPlan(), 9 * MINUTE + 59 * SECOND);
    clock.advanceBy(2 * SECOND);
    expect(machine.advance().map(describeEvent)).toEqual([
      '10:00 segmentEnded 4',
      '10:00 segmentStarted 5',
      '10:00 heave 5',
    ]);
  });
});

describe('Row freely', () => {
  it('never ends on its own and reports time rowed, not time left (R52)', () => {
    const { clock, machine } = rowingAt(rowFreelyPlan());
    expect(runFor(machine, clock, 2 * 60 * MINUTE, MINUTE)).toEqual([]);
    expect(machine.snapshot()).toMatchObject({
      phase: 'rowing',
      segmentIndex: 0,
      sessionElapsedMs: 2 * 60 * MINUTE,
      sessionRemainingMs: null,
      segmentRemainingMs: null,
    });
  });
});

describe('plan validation', () => {
  it('rejects a plan with no segments or a zero-length segment', () => {
    const clock = new ManualClock();
    const plan = fourByFourPlan();
    expect(() => createSessionMachine({ ...plan, segments: [] }, clock)).toThrow(/at least one/);
    expect(() => createSessionMachine({ ...plan, segments: [segment('push', 0)] }, clock)).toThrow(
      /length/,
    );
  });
});

describe('a full 4×4 session', () => {
  it('produces the expected event list over 40 minutes', () => {
    const clock = new ManualClock(0);
    const machine = createSessionMachine(fourByFourPlan(), clock);

    expect(runFor(machine, clock, 20 * SECOND + 41 * MINUTE).map(describeEvent)).toEqual([
      '-0:05 countIn 5',
      '-0:04 countIn 4',
      '-0:03 countIn 3',
      '-0:02 countIn 2',
      '-0:01 countIn 1',
      '0:00 segmentStarted 0',
      '5:00 segmentEnded 0',
      '5:00 segmentStarted 1',
      '5:20 segmentEnded 1',
      '5:20 segmentStarted 2',
      '7:00 segmentEnded 2',
      '7:00 segmentStarted 3',
      '7:20 segmentEnded 3',
      '7:20 segmentStarted 4',
      '9:50 horn 5',
      '10:00 segmentEnded 4',
      '10:00 segmentStarted 5',
      '10:00 heave 5',
      '14:00 segmentEnded 5',
      '14:00 pushEnd 5',
      '14:00 segmentStarted 6',
      '16:50 horn 7',
      '17:00 segmentEnded 6',
      '17:00 segmentStarted 7',
      '17:00 heave 7',
      '21:00 segmentEnded 7',
      '21:00 pushEnd 7',
      '21:00 segmentStarted 8',
      '23:50 horn 9',
      '24:00 segmentEnded 8',
      '24:00 segmentStarted 9',
      '24:00 heave 9',
      '28:00 segmentEnded 9',
      '28:00 pushEnd 9',
      '28:00 segmentStarted 10',
      '30:50 horn 11',
      '31:00 segmentEnded 10',
      '31:00 segmentStarted 11',
      '31:00 heave 11',
      '35:00 segmentEnded 11',
      '35:00 pushEnd 11',
      '35:00 segmentStarted 12',
      '40:00 segmentEnded 12',
      '40:00 sessionCompleted',
    ]);
    expect(machine.snapshot().phase).toBe('complete');
  });
});
