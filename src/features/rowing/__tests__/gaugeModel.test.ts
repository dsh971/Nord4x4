import { SLICE_PLAN } from '../../../content/slicePlan';
import { ManualClock } from '../../../domain/session/clock';
import { createSessionMachine } from '../../../domain/session/sessionMachine';
import type { SessionPlan } from '../../../domain/session/sessionPlan';
import { COOL_DOWN_LINE } from '../copy';
import { EFFORT_GUIDES } from '../effortGuide';
import {
  describeGauge,
  formatClock,
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
      footer: { kind: 'drum', strokesPerMinute: 27, isRowWithIt: true },
      note: null,
      isGlowing: false,
      sessionElapsedMs: PUSH_2_AT_1_48_LEFT,
      sessionLeftMs: 12 * MINUTE + 48 * SECOND,
    });
  });

  it('shows the next push in a rest, the clock in persimmon while the horn calls it (board 3.3)', () => {
    const gauge = gaugeAt(REST_10_S_BEFORE_PUSH_2);
    expect(gauge?.eyebrow).toBe('Rest');
    expect(gauge?.eyebrowTone).toBe('steady');
    expect(gauge?.clockTone).toBe('push');
    expect(gaugeAt(REST_10_S_BEFORE_PUSH_2 - SECOND)?.clockTone).toBe('ink');
    expect(gauge?.footer).toEqual({ kind: 'next', pushNumber: 2, pushMs: 3 * MINUTE });
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
    expect(gauge?.footer).toEqual({ kind: 'drum', strokesPerMinute: 27, isRowWithIt: false });
  });

  it('falls back to the effort guide, row-with-it line included, when a heart-rate plan has no reading', () => {
    const gauge = describeGauge(
      HR_SLICE,
      machineAt(PUSH_2_AT_1_48_LEFT, HR_SLICE).snapshot(),
      null,
    );
    expect(gauge?.body.kind).toBe('effort');
    expect(gauge?.footer).toEqual({ kind: 'drum', strokesPerMinute: 27, isRowWithIt: true });
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
  it("reads the slice as board 3.1a's one line, and an easy row without pushes plainly", () => {
    expect(summarizePlan(SLICE_PLAN)).toBe('Three 3′ pushes · 10′ warm-up first');
    expect(summarizePlan(ROW_FREELY)).toBe('An easy row at your own pace');
  });
});

describe('formatClock', () => {
  it('rounds seconds up, so a countdown reads 0:00 only when time is up', () => {
    expect(formatClock(107_200)).toBe('1:48');
    expect(formatClock(1)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
  });
});
