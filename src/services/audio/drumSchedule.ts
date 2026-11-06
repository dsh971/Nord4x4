import { isWorkSegment, type SegmentTiming } from '../../domain/session/sessionPlan';

/** How far ahead of session time sounds are scheduled on the audio clock (KTD5). */
export const LOOKAHEAD_MS = 600;

/** A stretch of session time in which the drum stays quiet while a signal plays, `fromMs` to `toMs`. */
export type DrumGap = { readonly fromMs: number; readonly toMs: number };

/** One drum hit: the catch's deep hit or a lead-in tap, at a level from 0 to 1. */
export type DrumHit = {
  readonly atMs: number;
  readonly sound: 'drum-catch' | 'drum-tap';
  readonly level: number;
};

// Easy rowing keeps one soft catch per stroke; work leads into each catch (drum audition, clip 3).
const SOFT_CATCH = 0.6;
// Two taps late in the recovery, rising into the catch: "tap · tap · BOOM", as shares of a stroke.
const LEAD_IN = [
  { beforeCatch: 0.3, level: 0.45 },
  { beforeCatch: 0.15, level: 0.55 },
];
const EARLIEST_TAP = Math.max(...LEAD_IN.map((tap) => tap.beforeCatch));

/**
 * The drum's hits in [fromMs, toMs): a catch on every stroke at each segment's rate, counted from the
 * segment's start, soft in easy rowing. In pushes and pickups two taps lead into each catch after the
 * segment's first; a lead-in plays only with its catch, so a segment never ends on taps and a signal
 * that silences a catch silences its taps too. Hits inside a gap are skipped. Half-open windows let a
 * scheduler ask for back-to-back windows without losing or doubling a hit.
 */
export function drumHitsBetween(
  timings: readonly SegmentTiming[],
  gaps: readonly DrumGap[],
  fromMs: number,
  toMs: number,
): DrumHit[] {
  const hits: DrumHit[] = [];
  const isInGap = (atMs: number) => gaps.some((gap) => atMs >= gap.fromMs && atMs < gap.toMs);
  const isInWindow = (atMs: number) => atMs >= fromMs && atMs < toMs;
  for (const { segment, startMs, endMs } of timings) {
    const segmentEndMs = endMs ?? Infinity;
    // A segment's first catch has no lead-in, so nothing it plays comes before its start.
    if (segmentEndMs <= fromMs || startMs >= toMs) {
      continue;
    }
    const strokeMs = 60_000 / segment.strokesPerMinute;
    const isWork = isWorkSegment(segment.type);
    // Floor, not ceil: it absorbs rounding where a catch computed from the start lands a hair after fromMs.
    const first = Math.max(0, Math.floor((fromMs - startMs) / strokeMs));
    // Each time is computed from the segment start, so rounding never drifts the beat.
    for (let stroke = first; ; stroke += 1) {
      const catchMs = startMs + stroke * strokeMs;
      if (catchMs >= segmentEndMs || catchMs - EARLIEST_TAP * strokeMs >= toMs) {
        break;
      }
      if (isInGap(catchMs)) {
        continue;
      }
      if (isWork && stroke > 0) {
        for (const tap of LEAD_IN) {
          const atMs = catchMs - tap.beforeCatch * strokeMs;
          if (isInWindow(atMs) && !isInGap(atMs)) {
            hits.push({ atMs, sound: 'drum-tap', level: tap.level });
          }
        }
      }
      if (isInWindow(catchMs)) {
        hits.push({ atMs: catchMs, sound: 'drum-catch', level: isWork ? 1 : SOFT_CATCH });
      }
    }
  }
  return hits;
}
