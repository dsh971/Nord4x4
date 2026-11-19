import { SLICE_PLAN } from '../../../content/slicePlan';
import { ManualClock } from '../../../domain/session/clock';
import { timedSegment } from '../../../domain/session/sessionBuilders';
import { calledWorkAt, createSessionMachine } from '../../../domain/session/sessionMachine';
import {
  segmentTimings,
  type SessionPlan,
  type TimedSegment,
} from '../../../domain/session/sessionPlan';
import { sceneStateAt, toSceneTimeline } from '../../../services/scene/sceneModel';
import { COOL_DOWN_LINE } from '../copy';
import { EFFORT_GUIDES } from '../effortGuide';
import {
  describeGauge,
  formatClock,
  spokenLength,
  formatGaugeClock,
  progressBarsOf,
  summarizePlan,
} from '../gaugeModel';
import {
  heart,
  HR_SLICE,
  machineAt,
  MINUTE,
  PUSH_2_AT_1_48_LEFT,
  PUSH_2_STARTS,
  REST_10_S_BEFORE_PUSH_2,
  ROW_FREELY,
  SECOND,
} from '../../../dev/rowingStates/sliceMoments';

function gaugeAt(sessionMs: number, plan: SessionPlan = SLICE_PLAN, input = heart(159)) {
  return describeGauge(plan, machineAt(sessionMs, plan).snapshot(), input);
}

describe('describeGauge', () => {
  it('shows a push in effort mode as on board 3.6, leaving bpm out even with a strap', () => {
    expect(gaugeAt(PUSH_2_AT_1_48_LEFT)).toEqual({
      segmentType: 'push',
      eyebrow: 'Push 2 of 3',
      eyebrowTone: 'push',
      clock: { kind: 'left', ms: 108 * SECOND },
      widestClock: '0:00',
      clockTone: 'ink',
      body: { kind: 'effort', guide: EFFORT_GUIDES.push },
      footer: { rate: { low: 26, high: 28 }, nextWork: null },
      note: null,
      isGlowing: false,
      sessionElapsedMs: PUSH_2_AT_1_48_LEFT,
      sessionLeftMs: 12 * MINUTE + 48 * SECOND,
    });
  });

  it('shows the next push in a rest, the clock in persimmon from its 10 s warning (board 3.3)', () => {
    const gauge = gaugeAt(REST_10_S_BEFORE_PUSH_2);
    expect(gauge?.eyebrow).toBe('Rest');
    expect(gauge?.eyebrowTone).toBe('steady');
    expect(gauge?.clockTone).toBe('work');
    expect(gaugeAt(REST_10_S_BEFORE_PUSH_2 - SECOND)?.clockTone).toBe('ink');
    expect(gauge?.footer).toEqual({
      rate: { low: 18, high: 22 },
      nextWork: { kind: 'push', number: 2, ms: 3 * MINUTE },
    });
    expect(gauge?.sessionLeftMs).toBe(14 * MINUTE + 10 * SECOND);
  });

  it('shows bpm against a target in a heart-rate plan (board 3.2: 156–166 at 85–90% of 184)', () => {
    const gauge = gaugeAt(PUSH_2_AT_1_48_LEFT, HR_SLICE);
    expect(gauge?.body).toEqual({
      kind: 'heart',
      bpm: 159,
      zone: 'inZone',
      target: { lowBpm: 156, highBpm: 166 },
    });
    expect(gauge?.footer).toEqual({ rate: { low: 26, high: 28 }, nextWork: null });
  });

  it('names a pickup by its place among the pickups, as a push is named', () => {
    expect(gaugeAt(5 * MINUTE + 10 * SECOND)?.eyebrow).toBe('Pickup 1 of 2');
    expect(gaugeAt(7 * MINUTE + 10 * SECOND)?.eyebrow).toBe('Pickup 2 of 2');
    expect(gaugeAt(5 * MINUTE + 10 * SECOND)?.eyebrowTone).toBe('push');
  });

  it("turns the clock persimmon from a pickup's 10 s warning until it starts, as before a push", () => {
    expect(gaugeAt(4 * MINUTE + 49_999)?.clockTone).toBe('ink');
    expect(gaugeAt(4 * MINUTE + 50 * SECOND)?.clockTone).toBe('work');
    expect(gaugeAt(4 * MINUTE + 59_999)?.clockTone).toBe('work');
    expect(gaugeAt(5 * MINUTE)?.clockTone).toBe('ink');
    expect(gaugeAt(9 * MINUTE + 50 * SECOND)?.clockTone).toBe('work');
  });

  it('names the push or pickup coming next wherever this stretch is not work', () => {
    const nextAt = (sessionMs: number) => gaugeAt(sessionMs)?.footer.nextWork;
    expect(nextAt(2 * MINUTE)).toEqual({ kind: 'pickup', number: 1, ms: 20 * SECOND });
    expect(nextAt(6 * MINUTE)).toEqual({ kind: 'pickup', number: 2, ms: 20 * SECOND });
    expect(nextAt(8 * MINUTE)).toEqual({ kind: 'push', number: 1, ms: 3 * MINUTE });
    expect(nextAt(5 * MINUTE + 10 * SECOND)).toBeNull();
    expect(nextAt(PUSH_2_AT_1_48_LEFT)).toBeNull();
  });

  it('shows a heart-rate pickup its target and "In zone", and never "Build"', () => {
    const pickup = gaugeAt(5 * MINUTE + 10 * SECOND, HR_SLICE, heart(160))?.body;
    expect(pickup).toEqual({
      kind: 'heart',
      bpm: 160,
      zone: 'inZone',
      target: { lowBpm: 156, highBpm: 166 },
    });
  });

  it('never shows "Build" in a pickup, even one long enough that a push would', () => {
    const zone = { lowPercentOfMax: 85, highPercentOfMax: 90 };
    const longPickup: SessionPlan = {
      segments: [timedSegment('pickup', 4 * MINUTE, zone), timedSegment('push', 4 * MINUTE, zone)],
      getSeatedHoldMs: 0,
      coachingMode: 'hr',
    };
    const zoneAt = (sessionMs: number) => {
      const body = gaugeAt(sessionMs, longPickup, heart(140))?.body;
      return body?.kind === 'heart' ? body.zone : undefined;
    };
    expect(zoneAt(100 * SECOND)).toBeNull();
    expect(zoneAt(4 * MINUTE + 100 * SECOND)).toBe('build');
  });

  it('switches the persimmon clock, the raised oars and the warning banner on and off together', () => {
    const timings = segmentTimings(SLICE_PLAN);
    const timeline = toSceneTimeline(timings);
    for (let sessionMs = 0; sessionMs < 30 * MINUTE; sessionMs += 500) {
      const isClockCalling = gaugeAt(sessionMs)?.clockTone === 'work';
      const isOarsRaised = sceneStateAt(timeline, sessionMs) === 'horn';
      const isBannerUp = calledWorkAt(timings, sessionMs) !== undefined;
      expect([sessionMs, isClockCalling, isOarsRaised]).toEqual([
        sessionMs,
        isBannerUp,
        isBannerUp,
      ]);
    }
  });

  it('falls back to the effort guide when a heart-rate plan has no reading', () => {
    const gauge = describeGauge(
      HR_SLICE,
      machineAt(PUSH_2_AT_1_48_LEFT, HR_SLICE).snapshot(),
      null,
    );
    expect(gauge?.body.kind).toBe('effort');
  });

  it('picks the zone chip by R36 and R50, and shows none rather than an untrue "In zone"', () => {
    const zoneAt = (sessionMs: number, input: ReturnType<typeof heart>) => {
      const body = gaugeAt(sessionMs, HR_SLICE, input)?.body;
      return body?.kind === 'heart' ? body.zone : undefined;
    };
    expect(zoneAt(PUSH_2_STARTS + 30 * SECOND, heart(178, { isGlowing: true }))).toBe('easeOff');
    expect(zoneAt(REST_10_S_BEFORE_PUSH_2, heart(131))).toBe('recovering');
    expect(zoneAt(PUSH_2_STARTS + 30 * SECOND, heart(160))).toBe('inZone');
    expect(zoneAt(PUSH_2_STARTS + 30 * SECOND, heart(172))).toBeNull();
    expect(zoneAt(PUSH_2_STARTS + 89 * SECOND, heart(140))).toBeNull();
    expect(zoneAt(PUSH_2_STARTS + 90 * SECOND, heart(140))).toBe('build');
    expect(zoneAt(PUSH_2_STARTS + 100 * SECOND, heart(140, { isMaxEstimated: true }))).toBeNull();
    expect(zoneAt(2 * MINUTE, heart(120))).toBeNull();
  });

  it('carries the ease-off glow with its chip in a heart-rate plan, and shows neither in effort mode', () => {
    const glowing = heart(178, { isGlowing: true });
    expect(gaugeAt(PUSH_2_AT_1_48_LEFT, HR_SLICE, glowing)?.isGlowing).toBe(true);
    expect(gaugeAt(PUSH_2_AT_1_48_LEFT, SLICE_PLAN, glowing)?.isGlowing).toBe(false);
  });

  it('counts Row freely up as time rowed, never a second ahead (R52)', () => {
    const gauge = gaugeAt(12 * MINUTE + 400, ROW_FREELY);
    expect(gauge?.clock).toEqual({ kind: 'rowed', ms: 12 * MINUTE + 400 });
    expect(gauge && formatGaugeClock(gauge.clock)).toBe('12:00');
    expect(gauge?.eyebrow).toBe('Row freely');
    expect(gauge?.sessionLeftMs).toBeNull();
    expect(gauge?.widestClock).toBe('00:00');
  });

  it('always shows the stroke rate to aim for: 18–22 in the warm-up and cool-down, 26–28 in work (G6a)', () => {
    expect(gaugeAt(2 * MINUTE)?.footer.rate).toEqual({ low: 18, high: 22 });
    expect(gaugeAt(5 * MINUTE + 10 * SECOND)?.footer.rate).toEqual({ low: 26, high: 28 });
    expect(gaugeAt(27 * MINUTE)?.footer).toEqual({ rate: { low: 18, high: 22 }, nextWork: null });
  });

  it('says to keep paddling in the cool-down (R61)', () => {
    expect(gaugeAt(27 * MINUTE)?.note).toBe(COOL_DOWN_LINE);
    expect(gaugeAt(PUSH_2_AT_1_48_LEFT)?.note).toBeNull();
  });

  it('shows nothing during Get seated, or once the row is complete or ended early', () => {
    const getSeated = createSessionMachine(SLICE_PLAN, new ManualClock());
    expect(describeGauge(SLICE_PLAN, getSeated.snapshot(), null)).toBeNull();
    const complete = machineAt(30 * MINUTE + SECOND);
    expect(complete.snapshot().phase).toBe('complete');
    expect(describeGauge(SLICE_PLAN, complete.snapshot(), null)).toBeNull();
    const endedEarly = machineAt(PUSH_2_AT_1_48_LEFT);
    endedEarly.pause('longPress');
    endedEarly.endSession();
    expect(endedEarly.snapshot().phase).toBe('partlyRowed');
    expect(describeGauge(SLICE_PLAN, endedEarly.snapshot(), null)).toBeNull();
  });
});

describe('progressBarsOf', () => {
  it('gives the strip every segment of the slice, both pickups included (U7)', () => {
    const bars = progressBarsOf(SLICE_PLAN);
    expect(bars).toHaveLength(SLICE_PLAN.segments.length);
    expect(bars.filter((bar) => bar.kind === 'pickup')).toHaveLength(2);
    expect(bars.reduce((sum, bar) => sum + bar.durationMs, 0)).toBe(30 * MINUTE);
  });
});

describe('summarizePlan', () => {
  it("reads the slice as board 3.1a's one line with its pickups, and an easy row without pushes plainly", () => {
    expect(summarizePlan(SLICE_PLAN)).toBe('Three 3′ pushes · 10′ warm-up first, with two pickups');
    expect(summarizePlan(ROW_FREELY)).toBe('An easy row at your own pace');
  });

  it('says "one pickup" for one, and leaves the clause out when the warm-up has none', () => {
    const planOf = (...segments: TimedSegment[]): SessionPlan => ({
      segments,
      getSeatedHoldMs: 0,
      coachingMode: 'effort',
    });
    expect(
      summarizePlan(
        planOf(
          timedSegment('warmUp', 4 * MINUTE + 40 * SECOND),
          timedSegment('pickup', 20 * SECOND),
          timedSegment('push', 3 * MINUTE),
        ),
      ),
    ).toBe('One 3′ push · 5′ warm-up first, with one pickup');
    expect(
      summarizePlan(planOf(timedSegment('warmUp', 5 * MINUTE), timedSegment('push', 3 * MINUTE))),
    ).toBe('One 3′ push · 5′ warm-up first');
  });
});

describe('spokenLength', () => {
  it('says a length in words, so VoiceOver never reads "0:20" as a time of day', () => {
    expect(spokenLength(20 * SECOND)).toBe('20 seconds');
    expect(spokenLength(3 * MINUTE)).toBe('3 minutes');
    expect(spokenLength(MINUTE + 30 * SECOND)).toBe('1 minute 30 seconds');
    expect(spokenLength(MINUTE + SECOND)).toBe('1 minute 1 second');
  });
});

describe('formatClock', () => {
  it('rounds seconds up, so a countdown reads 0:00 only when time is up', () => {
    expect(formatClock(107_200)).toBe('1:48');
    expect(formatClock(1)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
  });
});
