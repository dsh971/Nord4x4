import { HORN_LEAD_MS, type SessionSnapshot } from '../../domain/session/sessionMachine';
import {
  pushPositionAt,
  segmentTimings,
  type SegmentTiming,
  type SegmentType,
  type SessionPlan,
} from '../../domain/session/sessionPlan';
import type { BarKind, BarSegment } from '../../design/components/SegmentBars';
import type { ZoneState } from '../../design/components/ZoneChip';
import { COOL_DOWN_LINE } from './copy';
import { EFFORT_GUIDES, type EffortGuide } from './effortGuide';

/** Live heart rate for the gauge: the latest bpm, the max it is judged against, and the ease-off glow. */
export type HeartInput = {
  readonly bpm: number;
  readonly maxHeartRate: number;
  /** Max HR from age rather than measured: "Build ▼" never shows then (R50). */
  readonly isMaxEstimated: boolean;
  readonly isGlowing: boolean;
};

/** What the rowing screen shows at one moment (R29, R31, R36, R52; boards 3.2, 3.3 and 3.6). */
export type GaugeModel = {
  readonly segmentType: SegmentType;
  readonly eyebrow: string;
  readonly eyebrowTone: 'push' | 'steady';
  /** Time left in the segment; Row freely has no end, so it shows time rowed instead (R52). */
  readonly clock: { readonly kind: 'left' | 'rowed'; readonly ms: number };
  /** The widest clock this session can show, so the gauge is sized once and never jumps mid-row. */
  readonly widestClock: '0:00' | '00:00';
  /** Persimmon while the war horn calls the next push (board 3.3). */
  readonly clockTone: 'ink' | 'push';
  readonly body:
    | { readonly kind: 'effort'; readonly guide: EffortGuide }
    | {
        readonly kind: 'heart';
        readonly bpm: number;
        readonly zone: ZoneState | null;
        readonly target: { readonly lowBpm: number; readonly highBpm: number } | null;
      };
  readonly footer:
    | { readonly kind: 'drum'; readonly strokesPerMinute: number; readonly isRowWithIt: boolean }
    | { readonly kind: 'next'; readonly pushNumber: number; readonly pushMs: number };
  /** R61's cool-down line, or null outside the cool-down. */
  readonly note: string | null;
  readonly isGlowing: boolean;
  /** Where the rower is on the progress strip. */
  readonly sessionElapsedMs: number;
  readonly sessionLeftMs: number | null;
};

// "Build ▼" waits out the HR ramp: never in a push's first 90 s, or in pushes under 3 minutes (R50).
const BUILD_AFTER_MS = 90_000;
const BUILD_MIN_PUSH_MS = 180_000;

// A push's eyebrow also says which push it is, e.g. "Push 2 of 3".
const EYEBROWS: Record<SegmentType, string> = {
  push: 'Push',
  pickup: 'Pickup',
  rest: 'Rest',
  warmUp: 'Warm-up',
  coolDown: 'Cool-down',
  easy: 'Easy row',
  steady: 'Steady',
  benchmark: 'Benchmark',
  open: 'Row freely',
};

const BAR_KINDS: Record<SegmentType, BarKind> = {
  push: 'push',
  pickup: 'pickup',
  rest: 'rest',
  warmUp: 'easy',
  coolDown: 'easy',
  easy: 'easy',
  steady: 'easy',
  benchmark: 'easy',
  open: 'easy',
};

/**
 * "1:48" from 107.2 s left. A countdown rounds up, so it reads 0:00 only when time is up; time rowed
 * rounds down, so it never runs ahead.
 */
export function formatClock(ms: number, rounding: 'up' | 'down' = 'up'): string {
  const seconds = Math.max(0, (rounding === 'up' ? Math.ceil : Math.floor)(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The gauge's clock as text, rounded the right way for its direction. */
export function formatGaugeClock(clock: GaugeModel['clock']): string {
  return formatClock(clock.ms, clock.kind === 'rowed' ? 'down' : 'up');
}

/**
 * The rowing screen for a moment of the session, or null when there is no segment to show: during
 * Get seated, and once the row is complete or ended early. The plan's coaching mode decides whether
 * bpm or the effort guide leads (KTD21); without a heart reading the effort guide leads anyway (R30).
 */
export function describeGauge(
  plan: SessionPlan,
  snapshot: SessionSnapshot,
  heart: HeartInput | null,
): GaugeModel | null {
  const index = snapshot.segmentIndex;
  const isRowing = snapshot.phase === 'rowing' || snapshot.phase === 'paused';
  const timings = segmentTimings(plan);
  const timing = index === null ? undefined : timings[index];
  if (!isRowing || index === null || timing === undefined) {
    return null;
  }
  const { segment } = timing;
  const push = pushPositionAt(plan, index);
  const clock =
    snapshot.segmentRemainingMs === null
      ? { kind: 'rowed' as const, ms: snapshot.sessionElapsedMs - timing.startMs }
      : { kind: 'left' as const, ms: snapshot.segmentRemainingMs };
  const next = timings[index + 1];
  const nextPush = next?.segment.type === 'push' ? pushPositionAt(plan, index + 1) : null;
  const body: GaugeModel['body'] =
    plan.coachingMode === 'hr' && heart !== null
      ? describeHeart(timing, snapshot.sessionElapsedMs - timing.startMs, heart)
      : { kind: 'effort', guide: EFFORT_GUIDES[segment.type] };

  return {
    segmentType: segment.type,
    eyebrow: push ? `Push ${push.index + 1} of ${push.count}` : EYEBROWS[segment.type],
    eyebrowTone: segment.type === 'push' || segment.type === 'pickup' ? 'push' : 'steady',
    clock,
    widestClock: hasLongClock(timings) ? '00:00' : '0:00',
    clockTone:
      nextPush !== null && clock.kind === 'left' && clock.ms <= HORN_LEAD_MS ? 'push' : 'ink',
    body,
    footer:
      segment.type === 'rest' && nextPush !== null && next !== undefined && next.endMs !== null
        ? { kind: 'next', pushNumber: nextPush.index + 1, pushMs: next.endMs - next.startMs }
        : {
            kind: 'drum',
            strokesPerMinute: segment.strokesPerMinute,
            isRowWithIt: body.kind === 'effort',
          },
    note: segment.type === 'coolDown' ? COOL_DOWN_LINE : null,
    // Only where bpm leads: effort mode can't trust bpm (KTD21), so it shows no glow (decided 2026-11-05).
    isGlowing: body.kind === 'heart' && heart?.isGlowing === true,
    sessionElapsedMs: snapshot.sessionElapsedMs,
    sessionLeftMs: snapshot.sessionRemainingMs,
  };
}

// Row freely counts up without end, and a segment over 599 s starts at 10:00 once its seconds round up.
function hasLongClock(timings: readonly SegmentTiming[]): boolean {
  return timings.some(({ startMs, endMs }) => endMs === null || endMs - startMs > 599_000);
}

/**
 * The bpm reading and its zone chip (R36, R50). Above the target band but short of ease-off, no chip
 * shows: the bpm and the target line already say it, and "In zone" would be untrue (decided 2026-11-05).
 */
function describeHeart(
  timing: SegmentTiming,
  intoSegmentMs: number,
  heart: HeartInput,
): GaugeModel['body'] {
  const { segment, startMs, endMs } = timing;
  const zone = segment.targetZone;
  const target = zone
    ? {
        lowBpm: Math.round((heart.maxHeartRate * zone.lowPercentOfMax) / 100),
        highBpm: Math.round((heart.maxHeartRate * zone.highPercentOfMax) / 100),
      }
    : null;
  const canBuild =
    segment.type === 'push' &&
    endMs !== null &&
    endMs - startMs >= BUILD_MIN_PUSH_MS &&
    intoSegmentMs >= BUILD_AFTER_MS &&
    !heart.isMaxEstimated;
  const chip: ZoneState | null = heart.isGlowing
    ? 'easeOff'
    : segment.type === 'rest'
      ? 'recovering'
      : target === null || heart.bpm > target.highBpm
        ? null
        : heart.bpm < target.lowBpm
          ? canBuild
            ? 'build'
            : null
          : 'inZone';
  return { kind: 'heart', bpm: heart.bpm, zone: chip, target };
}

/** The progress strip's bars: every timed segment of the plan, pickups included (R31). */
export function progressBarsOf(plan: SessionPlan): BarSegment[] {
  return segmentTimings(plan).flatMap(({ segment, startMs, endMs }) =>
    endMs === null ? [] : [{ kind: BAR_KINDS[segment.type], durationMs: endMs - startMs }],
  );
}

/** Whether a plan holds pushes: R61's stop line shows before every hard session. */
export function isHardSession(plan: SessionPlan): boolean {
  return plan.segments.some((segment) => segment.type === 'push');
}

const COUNT_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

/** A count as a word for sentence copy, "Five" for 5; past eight it stays a numeral. */
export function countWord(count: number): string {
  return COUNT_WORDS[count - 1] ?? String(count);
}

/** Get seated's one-line plan, e.g. "Three 3′ pushes · 10′ warm-up first" (board 3.1a). */
export function summarizePlan(plan: SessionPlan): string {
  const pushes = segmentTimings(plan).filter(({ segment }) => segment.type === 'push');
  const firstPush = pushes[0];
  if (firstPush === undefined || firstPush.endMs === null) {
    return 'An easy row at your own pace';
  }
  const count = countWord(pushes.length);
  const pushMinutes = (firstPush.endMs - firstPush.startMs) / 60_000;
  const warmUpMinutes = firstPush.startMs / 60_000;
  const pushText = `${count} ${pushMinutes}′ push${pushes.length === 1 ? '' : 'es'}`;
  return warmUpMinutes > 0 ? `${pushText} · ${warmUpMinutes}′ warm-up first` : pushText;
}
