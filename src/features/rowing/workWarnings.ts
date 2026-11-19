import { warningStartsAtMs } from '../../domain/session/sessionMachine';
import type { SegmentTiming } from '../../domain/session/sessionPlan';
import type { WarningNotification } from '../../services/notifications/warningNotifications';
import { WARNING_BANNERS } from './banners';
import { sessionLeftLabel } from './gaugeModel';

// A notification due sooner than this would arrive after the warning has passed.
const MIN_LEAD_MS = 1_000;

/** Every push and pickup warning still to come at `sessionMs`, in order, for a rower who has left the app (R43). */
export function workWarningsFrom(
  timings: readonly SegmentTiming[],
  sessionMs: number,
): WarningNotification[] {
  const warnings: WarningNotification[] = [];
  const counts = { push: 0, pickup: 0 };
  for (const { segment, startMs } of timings) {
    if (segment.type !== 'push' && segment.type !== 'pickup') {
      continue;
    }
    counts[segment.type] += 1;
    const warnAtMs = warningStartsAtMs(startMs);
    const leadMs = warnAtMs - sessionMs;
    if (leadMs < MIN_LEAD_MS) {
      continue;
    }
    const leadSeconds = (startMs - warnAtMs) / 1000;
    warnings.push({
      id: `${segment.type}-${counts[segment.type]}`,
      secondsFromNow: leadMs / 1000,
      title: WARNING_BANNERS[segment.type].text,
      sound: 'warHorn',
      body:
        segment.type === 'push'
          ? `Push ${counts.push} starts in ${leadSeconds} s`
          : `Pickup starts in ${leadSeconds} s`,
    });
  }
  return warnings;
}

// Soon enough to read as an answer to leaving; the session time it shows is from the moment of leaving.
const STILL_ROWING_DELAY_SECONDS = 1;

/**
 * The silent notice, sent as the rower leaves, that the row goes on without them, with the session
 * time left when they left; a row with no end (Row freely) gives no time.
 */
export function stillRowingNotice(sessionLeftMs: number | null): WarningNotification {
  return {
    id: 'still-rowing',
    secondsFromNow: STILL_ROWING_DELAY_SECONDS,
    title: 'Row still going',
    body:
      sessionLeftMs === null
        ? 'Open for sound'
        : `${sessionLeftLabel(sessionLeftMs)} · Open for sound`,
    sound: 'none',
  };
}
