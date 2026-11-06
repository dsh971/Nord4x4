import type { HeartRateReading } from '../../domain/sensors/heartRateSource';
import { INITIAL_EASE_OFF, observeHeartRate, type EaseOffState } from '../../domain/heart/easeOff';
import type { MonotonicClock } from '../../domain/session/clock';
import {
  createSessionMachine,
  sessionClockMs,
  type PauseReason,
  type SessionEvent,
  type SessionMachine,
  type SessionPhase,
} from '../../domain/session/sessionMachine';
import {
  pushPositionAt,
  segmentTimings,
  type SegmentTiming,
  type SessionPlan,
} from '../../domain/session/sessionPlan';
import type { SessionSummary } from '../../domain/session/summary';
import type { SessionView } from '../../services/audio/audioEngine';
import { LOOKAHEAD_MS } from '../../services/audio/drumSchedule';
import { SIGNAL_BANNERS, type Banner } from './banners';
import { describeGauge, type GaugeModel, type HeartInput } from './gaugeModel';

/** The part of the audio engine a session drives each tick; the engine itself is started by the screen. */
export type SessionSoundCues = {
  update(view: SessionView): void;
  playEaseOff(sessionMs: number): void;
};

/** A heart-rate feed: the reading at a moment of the session, or null with no strap on. */
export type HeartFeed = {
  readonly feed: (sessionMs: number) => HeartRateReading | null;
  readonly maxHeartRate: number;
  readonly isMaxEstimated: boolean;
};

/** Everything the rowing screen draws for one tick. */
export type RowingView = {
  readonly phase: SessionPhase;
  readonly pauseReason: PauseReason | null;
  /** Session time: negative during Get seated. */
  readonly sessionMs: number;
  readonly getSeatedRemainingMs: number;
  readonly gauge: GaugeModel | null;
  readonly banner: Banner | null;
  readonly summary: SessionSummary | null;
};

/** How long a signal's banner stays up, from its cue (R40: "about 3 s"). */
const BANNER_MS = 3_000;
/** A strap reports about once a second. */
const HEART_SAMPLE_MS = 1_000;

/**
 * One row of a session plan, tick by tick (U7): the session machine keeps time (KTD5), and each tick
 * turns its events into banners, its snapshot into the gauge, heart readings into the ease-off (R36),
 * and hands the audio engine the cues due next. It has no timers of its own; the screen ticks it.
 */
export class RowingSession {
  private readonly machine: SessionMachine;
  private readonly timings: readonly SegmentTiming[];
  private sound: SessionSoundCues | null = null;
  private banner: { readonly banner: Banner; readonly untilMs: number } | null = null;
  private pauseReason: PauseReason | null = null;
  private summary: SessionSummary | null = null;
  private easeOff: EaseOffState = INITIAL_EASE_OFF;
  private heart: HeartInput | null = null;
  private lastHeartSampleMs = -Infinity;

  constructor(
    private readonly plan: SessionPlan,
    clock: MonotonicClock,
    private readonly heartFeed: HeartFeed | null,
  ) {
    this.machine = createSessionMachine(plan, clock);
    this.timings = segmentTimings(plan);
  }

  /** Connects the audio engine once it has loaded; until then the row runs silent. */
  setSound(sound: SessionSoundCues): void {
    this.sound = sound;
  }

  /** Moves the session to now and says what to draw. */
  tick(): RowingView {
    this.apply(this.machine.advance());
    const snapshot = this.machine.snapshot();
    const sessionMs = sessionClockMs(snapshot);
    if (snapshot.phase === 'rowing') {
      this.observeHeart(sessionMs, snapshot.segmentIndex);
    }
    if (snapshot.phase === 'getSeated' || snapshot.phase === 'rowing') {
      this.sound?.update({
        sessionMs,
        timings: this.timings,
        upcomingCues: this.machine.upcomingCues(LOOKAHEAD_MS),
      });
    }
    return {
      phase: snapshot.phase,
      pauseReason: this.pauseReason,
      sessionMs,
      getSeatedRemainingMs: snapshot.getSeatedRemainingMs,
      gauge: describeGauge(this.plan, snapshot, this.heart),
      banner: this.banner && sessionMs < this.banner.untilMs ? this.banner.banner : null,
      summary: this.summary,
    };
  }

  /** Ends Get seated now (R23). */
  startNow(): void {
    this.apply(this.machine.startNow());
  }

  /** Pauses the row: a long press, or iOS taking the audio (R32). */
  pause(reason: PauseReason): void {
    this.apply(this.machine.pause(reason));
  }

  /** Picks the row up where it paused. */
  resume(): void {
    this.apply(this.machine.resume());
  }

  /** Ends the row early from the pause sheet; it is saved as Partly rowed (R32, R54). */
  endSession(): void {
    this.apply(this.machine.endSession());
  }

  private apply(events: readonly SessionEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'cueDue': {
          const banner = SIGNAL_BANNERS[event.cue.kind];
          if (banner !== null) {
            this.banner = { banner, untilMs: event.atMs + BANNER_MS };
          }
          break;
        }
        case 'paused':
          this.pauseReason = event.reason;
          break;
        case 'resumed':
          this.pauseReason = null;
          break;
        case 'sessionCompleted':
        case 'sessionEndedEarly':
          this.summary = event.summary;
          break;
        case 'segmentStarted':
        case 'segmentEnded':
          break;
      }
    }
  }

  private observeHeart(sessionMs: number, segmentIndex: number | null): void {
    if (this.heartFeed === null || sessionMs - this.lastHeartSampleMs < HEART_SAMPLE_MS) {
      return;
    }
    this.lastHeartSampleMs = sessionMs;
    const reading = this.heartFeed.feed(sessionMs);
    if (reading === null) {
      return;
    }
    const pushIndex =
      segmentIndex === null ? null : (pushPositionAt(this.plan, segmentIndex)?.index ?? null);
    const result = observeHeartRate(this.easeOff, reading, {
      maxHeartRate: this.heartFeed.maxHeartRate,
      pushIndex,
    });
    this.easeOff = result.state;
    if (result.shouldRingBells) {
      this.sound?.playEaseOff(sessionMs);
    }
    this.heart =
      reading.type === 'sample'
        ? {
            bpm: reading.bpm,
            maxHeartRate: this.heartFeed.maxHeartRate,
            isMaxEstimated: this.heartFeed.isMaxEstimated,
            isGlowing: result.state.isGlowing,
          }
        : null;
  }
}
