import type { SessionCheckpoint } from './checkpoint';
import type { MonotonicClock } from './clock';
import {
  isWorkSegment,
  plannedLengthMs,
  segmentTimings,
  validateSessionPlan,
  type SegmentTiming,
  type SessionPlan,
} from './sessionPlan';
import { summarizeSession, type SessionSummary } from './summary';

/** Where a session is: Get seated, rowing, paused, or one of its two endings. */
export type SessionPhase = 'getSeated' | 'rowing' | 'paused' | 'complete' | 'partlyRowed';

/** What paused the row: the rower's long press, or iOS taking the audio (a call, Siri). */
export type PauseReason = 'longPress' | 'interruption';

/** A cue tied to a push or a pickup, carrying that segment's index. */
export type WorkCueKind =
  'horn' | 'pushStart' | 'pickupStart' | 'holdEffort' | 'pushEnd' | 'pickupEnd';

/**
 * A signal the audio and screen play together (R40). Get seated count-ins carry their number. The
 * silent 10 s warnings aren't cues: the screen reads them off session time (calledWorkAt).
 */
export type Cue =
  | { readonly kind: 'countIn'; readonly count: number }
  | { readonly kind: WorkCueKind; readonly segmentIndex: number };

/**
 * Everything the machine announces. `atMs` is session time: 0 is the moment rowing starts,
 * and Get seated runs at negative times.
 */
export type SessionEvent =
  | { readonly type: 'segmentStarted'; readonly segmentIndex: number; readonly atMs: number }
  | { readonly type: 'segmentEnded'; readonly segmentIndex: number; readonly atMs: number }
  | { readonly type: 'cueDue'; readonly cue: Cue; readonly atMs: number }
  | { readonly type: 'paused'; readonly reason: PauseReason; readonly atMs: number }
  | { readonly type: 'resumed'; readonly atMs: number }
  | { readonly type: 'sessionCompleted'; readonly summary: SessionSummary; readonly atMs: number }
  | { readonly type: 'sessionEndedEarly'; readonly summary: SessionSummary; readonly atMs: number };

/** What the gauge shows right now. Remaining times are null for Row freely, which counts up (R52). */
export type SessionSnapshot = {
  readonly phase: SessionPhase;
  readonly getSeatedRemainingMs: number;
  readonly sessionElapsedMs: number;
  readonly sessionRemainingMs: number | null;
  /** Null during Get seated. */
  readonly segmentIndex: number | null;
  readonly segmentRemainingMs: number | null;
};

/** Session time a snapshot stands at: negative during Get seated, as the audio and scene read it. */
export function sessionClockMs(snapshot: SessionSnapshot): number {
  return snapshot.phase === 'getSeated'
    ? -snapshot.getSeatedRemainingMs
    : snapshot.sessionElapsedMs;
}

/** A cue this late is dropped rather than played late (KTD5). */
export const STALE_CUE_MS = 2_000;
/** How many drum beats count the rower in at the end of Get seated (R23). */
export const COUNT_IN_BEATS = 5;
/** How long before a push or pickup its warning banner shows (R40: "Push or pickup in 10 s"). */
export const WARNING_LEAD_MS = 10_000;
/**
 * How long before a push or pickup the war horn sounds. The drum stays quiet for the horn's whole
 * 5.2 s file, so at 6 s the drum is back before the push-start strike.
 */
export const HORN_LEAD_MS = 6_000;

/** When a push's or pickup's warning shows: WARNING_LEAD_MS before it, but never before the row starts. */
export function warningStartsAtMs(workStartMs: number): number {
  'worklet';
  return Math.max(0, workStartMs - WARNING_LEAD_MS);
}

/** When a push's or pickup's war horn sounds: HORN_LEAD_MS before it, but never before the row starts. */
export function hornCueAtMs(workStartMs: number): number {
  'worklet';
  return Math.max(0, workStartMs - HORN_LEAD_MS);
}

/** Whether work starting at `workStartMs` is being called at `sessionMs`: from its warning until it starts. */
function isCalled(workStartMs: number, sessionMs: number): boolean {
  'worklet';
  return sessionMs >= warningStartsAtMs(workStartMs) && sessionMs < workStartMs;
}

/** Whether a push is being called at `sessionMs`: from its warning until the push starts (R27, R40). */
export function isPushCalled(pushStartsMs: readonly number[], sessionMs: number): boolean {
  'worklet';
  for (const startMs of pushStartsMs) {
    if (isCalled(startMs, sessionMs)) {
      return true;
    }
  }
  return false;
}

/** The push or pickup being called at `sessionMs`, from its warning until it starts (R40), if any. */
export function calledWorkAt(
  timings: readonly SegmentTiming[],
  sessionMs: number,
): SegmentTiming | undefined {
  return timings.find(
    (timing) => isWorkSegment(timing.segment.type) && isCalled(timing.startMs, sessionMs),
  );
}
const HOLD_EFFORT_AFTER_MS = 90_000;

/** Starts a session at Get seated, timed by `clock`; throws if the plan can't be rowed. */
export function createSessionMachine(plan: SessionPlan, clock: MonotonicClock): SessionMachine {
  return new SessionMachine(plan, clock, {
    phase: 'getSeated',
    anchorMs: clock.nowMs() + plan.getSeatedHoldMs,
    pausedAtMs: 0,
    emittedThroughMs: -Infinity,
  });
}

/**
 * Picks a session up from a checkpoint in a new process. Time the app was gone counts as rowing
 * unless the row was paused: in Silent mode the rower keeps rowing while iOS may end the app.
 */
export function restoreSessionMachine(options: {
  plan: SessionPlan;
  clock: MonotonicClock;
  checkpoint: SessionCheckpoint;
  wallNowMs: number;
}): SessionMachine {
  const { plan, clock, checkpoint, wallNowMs } = options;
  const lengthMs = plannedLengthMs(plan);
  if (checkpoint.sessionMs < 0 || (lengthMs !== null && checkpoint.sessionMs > lengthMs)) {
    throw new Error(
      `Checkpoint at ${checkpoint.sessionMs} ms lies outside the plan's ${lengthMs} ms`,
    );
  }
  // A wall clock set backwards would rewind the row; treat it as no time away instead.
  const awayMs = Math.max(0, wallNowMs - checkpoint.savedAtWallMs);
  const sessionMs =
    checkpoint.phase === 'rowing' ? checkpoint.sessionMs + awayMs : checkpoint.sessionMs;
  return new SessionMachine(plan, clock, {
    phase: checkpoint.phase,
    anchorMs: clock.nowMs() - sessionMs,
    pausedAtMs: checkpoint.sessionMs,
    emittedThroughMs: checkpoint.emittedThroughMs,
  });
}

type MachineState = {
  phase: SessionPhase;
  /** The monotonic time at which session time was 0; moved forward by each pause. */
  anchorMs: number;
  /** Session time when the row was paused or ended early. */
  pausedAtMs: number;
  emittedThroughMs: number;
};

/**
 * A session as a state machine over a monotonic clock (KTD5). State comes from elapsed time, never
 * from how often `advance` is called, and each scheduled event is emitted at most once.
 */
export class SessionMachine {
  private readonly timings: readonly SegmentTiming[];
  private readonly lengthMs: number | null;
  /** Every segment boundary and cue, sorted by time; `cursor` is the next one not yet emitted. */
  private readonly timeline: readonly SessionEvent[];
  private cursor: number;
  private phase: SessionPhase;
  private anchorMs: number;
  private pausedAtMs: number;

  constructor(
    private readonly plan: SessionPlan,
    private readonly clock: MonotonicClock,
    state: MachineState,
  ) {
    validateSessionPlan(plan);
    this.timings = segmentTimings(plan);
    this.lengthMs = plannedLengthMs(plan);
    this.timeline = buildTimeline(plan, this.timings, this.lengthMs);
    this.cursor = this.timeline.findIndex((event) => event.atMs > state.emittedThroughMs);
    if (this.cursor === -1) {
      this.cursor = this.timeline.length;
    }
    this.phase = state.phase;
    this.anchorMs = state.anchorMs;
    this.pausedAtMs = state.pausedAtMs;
  }

  /** Emits every event due by now, in order. Cues more than 2 s late are dropped; boundaries never are. */
  advance(): SessionEvent[] {
    if (this.phase !== 'getSeated' && this.phase !== 'rowing') {
      return [];
    }
    const nowMs = this.sessionNowMs();
    const due: SessionEvent[] = [];
    for (
      let event = this.timeline[this.cursor];
      event && event.atMs <= nowMs;
      event = this.timeline[this.cursor]
    ) {
      this.cursor += 1;
      if (event.atMs >= 0 && this.phase === 'getSeated') {
        this.phase = 'rowing';
      }
      if (event.type === 'cueDue' && nowMs - event.atMs > STALE_CUE_MS) {
        continue;
      }
      if (event.type === 'sessionCompleted') {
        this.phase = 'complete';
      }
      due.push(event);
    }
    return due;
  }

  /** Ends Get seated now ("Start now", R23): the count-in is skipped and the first segment starts. */
  startNow(): SessionEvent[] {
    this.requirePhase('getSeated', 'start now');
    this.anchorMs = this.clock.nowMs();
    const firstRowing = this.timeline.findIndex((event) => event.atMs >= 0);
    this.cursor = firstRowing === -1 ? this.timeline.length : firstRowing;
    return this.advance();
  }

  /** Pauses the row; audio cancels its scheduled cues on the `paused` event (KTD5). */
  pause(reason: PauseReason): SessionEvent[] {
    this.requirePhase('rowing', 'pause');
    const due = this.advance();
    // The session may have just reached its end; there is nothing left to pause.
    if (this.phase !== 'rowing') {
      return due;
    }
    this.pausedAtMs = this.sessionNowMs();
    this.phase = 'paused';
    return [...due, { type: 'paused', reason, atMs: this.pausedAtMs }];
  }

  /** Resumes a paused row where it stopped; the time paused moves every later event back. */
  resume(): SessionEvent[] {
    this.requirePhase('paused', 'resume');
    this.anchorMs = this.clock.nowMs() - this.pausedAtMs;
    this.phase = 'rowing';
    return [{ type: 'resumed', atMs: this.pausedAtMs }];
  }

  /** Ends a paused row early as Partly rowed (R54); the session never completes after this. */
  endSession(): SessionEvent[] {
    this.requirePhase('paused', 'end the session');
    this.phase = 'partlyRowed';
    const summary = summarizeSession(this.plan, this.pausedAtMs, 'partlyRowed');
    return [{ type: 'sessionEndedEarly', summary, atMs: this.pausedAtMs }];
  }

  /** The cues due within `horizonMs`, so audio can schedule them ahead; none while paused. */
  upcomingCues(horizonMs: number): SessionEvent[] {
    if (this.phase !== 'getSeated' && this.phase !== 'rowing') {
      return [];
    }
    const nowMs = this.sessionNowMs();
    return this.timeline
      .slice(this.cursor)
      .filter(
        (event) =>
          event.type === 'cueDue' &&
          event.atMs <= nowMs + horizonMs &&
          nowMs - event.atMs <= STALE_CUE_MS,
      );
  }

  /** Time left and time rowed, read from the clock now. Call `advance` first to bring the phase up to date. */
  snapshot(): SessionSnapshot {
    const nowMs = this.sessionNowMs();
    const rowedMs = Math.max(0, nowMs);
    const timing =
      nowMs < 0
        ? undefined
        : (this.timings.find((candidate) => candidate.endMs === null || nowMs < candidate.endMs) ??
          this.timings.at(-1));
    return {
      phase: this.phase,
      getSeatedRemainingMs: Math.max(0, -nowMs),
      sessionElapsedMs: rowedMs,
      sessionRemainingMs: this.lengthMs === null ? null : Math.max(0, this.lengthMs - rowedMs),
      segmentIndex: timing ? this.timings.indexOf(timing) : null,
      segmentRemainingMs:
        timing && timing.endMs !== null ? Math.max(0, timing.endMs - rowedMs) : null,
    };
  }

  /** The state to save every 10 s (KTD4), or null when there is no row in progress to resume. */
  toCheckpoint(wallNowMs: number): SessionCheckpoint | null {
    const lastEmitted = this.timeline[this.cursor - 1];
    if ((this.phase !== 'rowing' && this.phase !== 'paused') || !lastEmitted) {
      return null;
    }
    return {
      version: 1,
      phase: this.phase,
      sessionMs: this.sessionNowMs(),
      emittedThroughMs: lastEmitted.atMs,
      savedAtWallMs: wallNowMs,
    };
  }

  private sessionNowMs(): number {
    switch (this.phase) {
      case 'getSeated':
      case 'rowing':
        return Math.min(this.clock.nowMs() - this.anchorMs, this.lengthMs ?? Infinity);
      case 'paused':
      case 'partlyRowed':
        return this.pausedAtMs;
      case 'complete':
        return this.lengthMs ?? 0;
    }
  }

  private requirePhase(expected: SessionPhase, action: string): void {
    if (this.phase !== expected) {
      throw new Error(`Can only ${action} while ${expected}; the session is ${this.phase}`);
    }
  }
}

function buildTimeline(
  plan: SessionPlan,
  timings: readonly SegmentTiming[],
  lengthMs: number | null,
): SessionEvent[] {
  const events: SessionEvent[] = [];
  for (let count = COUNT_IN_BEATS; count >= 1; count -= 1) {
    if (count * 1000 <= plan.getSeatedHoldMs) {
      events.push({ type: 'cueDue', cue: { kind: 'countIn', count }, atMs: -count * 1000 });
    }
  }
  timings.forEach(({ segment, startMs, endMs }, segmentIndex) => {
    events.push({ type: 'segmentStarted', segmentIndex, atMs: startMs });
    if (segment.type === 'push' || segment.type === 'pickup') {
      // Pickups inside the warm-up are pushes in miniature: horned, started and ended alike.
      const isPush = segment.type === 'push';
      const cue = (kind: WorkCueKind, atMs: number): SessionEvent => ({
        type: 'cueDue',
        cue: { kind, segmentIndex },
        atMs,
      });
      events.push(
        cue('horn', hornCueAtMs(startMs)),
        cue(isPush ? 'pushStart' : 'pickupStart', startMs),
      );
      if (isPush && plan.coachingMode === 'effort' && segment.durationMs > HOLD_EFFORT_AFTER_MS) {
        events.push(cue('holdEffort', startMs + HOLD_EFFORT_AFTER_MS));
      }
      if (endMs !== null) {
        events.push(
          { type: 'segmentEnded', segmentIndex, atMs: endMs },
          cue(isPush ? 'pushEnd' : 'pickupEnd', endMs),
        );
      }
    } else if (endMs !== null) {
      events.push({ type: 'segmentEnded', segmentIndex, atMs: endMs });
    }
  });
  if (lengthMs !== null) {
    events.push({
      type: 'sessionCompleted',
      summary: summarizeSession(plan, lengthMs, 'completed'),
      atMs: lengthMs,
    });
  }
  // Array sort is stable, so events at the same moment keep the order they were built in:
  // the old segment ends before the new one starts, and a push or pickup starts before its start cue.
  return events.sort((a, b) => a.atMs - b.atMs);
}
