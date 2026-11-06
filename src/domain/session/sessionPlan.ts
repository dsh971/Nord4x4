/** Kinds of segment a session can hold. Pickups are the short bursts inside a warm-up. */
export type SegmentType =
  'warmUp' | 'pickup' | 'push' | 'rest' | 'easy' | 'steady' | 'coolDown' | 'benchmark' | 'open';

/** How the scene paints a segment (R27). */
export type SceneState = 'work' | 'rest' | 'horn' | 'easy' | 'swell' | 'rough';

/** Whether coaching reads bpm or perceived effort (KTD21). */
export type CoachingMode = 'hr' | 'effort';

/** A heart-rate target as a share of max HR, in percent. */
export type HeartRateZone = {
  readonly lowPercentOfMax: number;
  readonly highPercentOfMax: number;
};

type SegmentBase = {
  readonly targetZone: HeartRateZone | null;
  /** The drum's rate; v1 measures no strokes, so this is also the rate the gauge shows (KTD12). */
  readonly strokesPerMinute: number;
  readonly scene: SceneState;
};

/** A segment with a fixed length. */
export type TimedSegment = SegmentBase & {
  readonly type: Exclude<SegmentType, 'open'>;
  readonly durationMs: number;
};

/** Row freely: one segment with no end, which counts time up (R52). */
export type OpenSegment = SegmentBase & { readonly type: 'open' };

export type Segment = TimedSegment | OpenSegment;

/** One session to row: a list of timed segments, or a single open segment. */
export type SessionPlan = {
  readonly segments: readonly TimedSegment[] | readonly [OpenSegment];
  readonly getSeatedHoldMs: number;
  readonly coachingMode: CoachingMode;
};

/** A segment and where it sits on the session's timeline; only an open segment has no end. */
export type SegmentTiming =
  | { readonly segment: TimedSegment; readonly startMs: number; readonly endMs: number }
  | { readonly segment: OpenSegment; readonly startMs: number; readonly endMs: null };

/** Whether a kind of segment is work: pushes, and the pickups inside a warm-up. */
export function isWorkSegment(type: SegmentType): boolean {
  return type === 'push' || type === 'pickup';
}

/** The default Get seated hold time (R23). */
export const DEFAULT_GET_SEATED_HOLD_MS = 20_000;

/** Throws if the plan can't be rowed: no segments, a non-positive length or rate, or a negative hold. */
export function validateSessionPlan(plan: SessionPlan): void {
  if (plan.segments.length === 0) {
    throw new Error('A session plan needs at least one segment');
  }
  if (!Number.isFinite(plan.getSeatedHoldMs) || plan.getSeatedHoldMs < 0) {
    throw new Error(`Get seated hold must be zero or more ms; got ${plan.getSeatedHoldMs}`);
  }
  plan.segments.forEach((segment: Segment, index) => {
    if (!Number.isFinite(segment.strokesPerMinute) || segment.strokesPerMinute <= 0) {
      throw new Error(
        `Segment ${index} stroke rate must be a positive number; got ${segment.strokesPerMinute}`,
      );
    }
    if (
      segment.type !== 'open' &&
      !(Number.isFinite(segment.durationMs) && segment.durationMs > 0)
    ) {
      throw new Error(
        `Segment ${index} length must be a positive number of ms; got ${segment.durationMs}`,
      );
    }
  });
}

/** Start and end of every segment, measured from the moment rowing starts. */
export function segmentTimings(plan: SessionPlan): readonly SegmentTiming[] {
  let startMs = 0;
  return plan.segments.map((segment: Segment): SegmentTiming => {
    if (segment.type === 'open') {
      return { segment, startMs, endMs: null };
    }
    const timing = { segment, startMs, endMs: startMs + segment.durationMs };
    startMs = timing.endMs;
    return timing;
  });
}

/** The session's planned length in ms, or null for Row freely. */
export function plannedLengthMs(plan: SessionPlan): number | null {
  const last = segmentTimings(plan).at(-1);
  return last?.endMs ?? null;
}

/** Which push a segment is, counting from 0, out of how many; null if it isn't a push (R29, R36). */
export function pushPositionAt(
  plan: SessionPlan,
  segmentIndex: number,
): { readonly index: number; readonly count: number } | null {
  const pushes: number[] = plan.segments.flatMap((segment: Segment, index) =>
    segment.type === 'push' ? [index] : [],
  );
  const index = pushes.indexOf(segmentIndex);
  return index === -1 ? null : { index, count: pushes.length };
}
