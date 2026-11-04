import { plannedLengthMs, segmentTimings, type SessionPlan } from './sessionPlan';

/** How a session ended: rowed to the end, or ended early from the pause sheet (R54). */
export type SessionOutcome = 'completed' | 'partlyRowed';

/** What a finished or abandoned session amounted to, before any heart-rate scoring (U12). */
export type SessionSummary = {
  readonly outcome: SessionOutcome;
  readonly rowedMs: number;
  /** Null for Row freely, which has no planned length. */
  readonly plannedMs: number | null;
  readonly pushesCompleted: number;
  readonly pushesPlanned: number;
};

/** Summarizes a plan rowed for `rowedMs`; a push counts once its last moment has been rowed. */
export function summarizeSession(
  plan: SessionPlan,
  rowedMs: number,
  outcome: SessionOutcome,
): SessionSummary {
  if (!Number.isFinite(rowedMs) || rowedMs < 0) {
    throw new Error(`Time rowed must be zero or more ms; got ${rowedMs}`);
  }
  const pushEnds = segmentTimings(plan).flatMap((timing) =>
    timing.segment.type === 'push' && timing.endMs !== null ? [timing.endMs] : [],
  );
  return {
    outcome,
    rowedMs,
    plannedMs: plannedLengthMs(plan),
    pushesCompleted: pushEnds.filter((endMs) => endMs <= rowedMs).length,
    pushesPlanned: pushEnds.length,
  };
}
