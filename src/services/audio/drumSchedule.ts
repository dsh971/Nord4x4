import type { SegmentTiming } from '../../domain/session/sessionPlan';

/** A stretch of session time in which the drum stays quiet while a signal plays, `fromMs` to `toMs`. */
export type DrumGap = { readonly fromMs: number; readonly toMs: number };

/**
 * Session times of the drum's strokes in [fromMs, toMs): one per stroke at each segment's rate,
 * counted from the segment's start, minus any stroke inside a gap. Half-open windows let a scheduler
 * ask for back-to-back windows without losing or doubling a stroke.
 */
export function drumHitsBetween(
  timings: readonly SegmentTiming[],
  gaps: readonly DrumGap[],
  fromMs: number,
  toMs: number,
): number[] {
  const hits: number[] = [];
  for (const { segment, startMs, endMs } of timings) {
    const segmentEndMs = endMs ?? Infinity;
    if (segmentEndMs <= fromMs || startMs >= toMs) {
      continue;
    }
    const strokeMs = 60_000 / segment.strokesPerMinute;
    // Each stroke time is computed from the segment start, so rounding never drifts the beat.
    for (let stroke = Math.max(0, Math.ceil((fromMs - startMs) / strokeMs)); ; stroke += 1) {
      const atMs = startMs + stroke * strokeMs;
      if (atMs >= toMs || atMs >= segmentEndMs) {
        break;
      }
      if (atMs >= fromMs && !gaps.some((gap) => atMs >= gap.fromMs && atMs < gap.toMs)) {
        hits.push(atMs);
      }
    }
  }
  return hits;
}
