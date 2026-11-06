import { SLICE_PLAN } from '../../../content/slicePlan';
import { FAKE_MAX_HEART_RATE, fakeHeartRate } from '../../../dev/fakeHeartTrace';
import { HR_SLICE, MINUTE, PUSH_2_STARTS, SECOND } from '../../../dev/rowingStates/sliceMoments';
import { ManualClock } from '../../../domain/session/clock';
import type { SessionView } from '../../../services/audio/audioEngine';
import { RowingSession, type RowingView, type SessionSoundCues } from '../rowingSession';

class RecordingSound implements SessionSoundCues {
  readonly views: SessionView[] = [];
  readonly easeOffsAtMs: number[] = [];
  update(view: SessionView): void {
    this.views.push(view);
  }
  playEaseOff(sessionMs: number): void {
    this.easeOffsAtMs.push(sessionMs);
  }
}

/** A session started now, ticked every 100 ms up to `sessionMs`; returns every view along the way. */
function rowTo(
  session: RowingSession,
  clock: ManualClock,
  fromMs: number,
  toMs: number,
): RowingView[] {
  const views: RowingView[] = [];
  for (let atMs = fromMs; atMs < toMs; atMs += 100) {
    clock.advanceBy(100);
    views.push(session.tick());
  }
  return views;
}

function startedSession(plan = SLICE_PLAN, withHeart = false) {
  const clock = new ManualClock();
  const sound = new RecordingSound();
  const session = new RowingSession(
    plan,
    clock,
    withHeart
      ? { feed: fakeHeartRate(plan), maxHeartRate: FAKE_MAX_HEART_RATE, isMaxEstimated: false }
      : null,
  );
  session.setSound(sound);
  session.startNow();
  return { clock, session, sound };
}

describe('RowingSession', () => {
  it('shows each signal banner for 3 s from its cue: "Ready oars" with the edge pulse, then "Pull"', () => {
    const { clock, session } = startedSession();
    const hornAtMs = PUSH_2_STARTS - 10 * SECOND;
    rowTo(session, clock, 0, hornAtMs);
    const during = rowTo(session, clock, hornAtMs, hornAtMs + 2_900);
    expect(during.at(-1)?.banner).toEqual({ text: 'Ready oars', hasEdgePulse: true });
    const after = rowTo(session, clock, hornAtMs + 2_900, hornAtMs + 3_200);
    expect(after.at(-1)?.banner).toBeNull();
    const pushStart = rowTo(session, clock, hornAtMs + 3_200, PUSH_2_STARTS + 500);
    expect(pushStart.at(-1)?.banner?.text).toBe('Pull');
  });

  it('calls for "Hold this effort" 90 s into a push in effort mode, and not in heart-rate mode', () => {
    const holdAt = PUSH_2_STARTS + 90 * SECOND + 500;
    const effort = startedSession();
    const effortViews = rowTo(effort.session, effort.clock, 0, holdAt);
    expect(effortViews.at(-1)?.banner?.text).toBe('Hold this effort');
    const hr = startedSession(HR_SLICE, true);
    const hrViews = rowTo(hr.session, hr.clock, 0, holdAt);
    expect(hrViews.some((view) => view.banner?.text === 'Hold this effort')).toBe(false);
  });

  it('rings the ease-off bells once in push 2 when the strap stays over 95%, and glows while it does (U7)', () => {
    const { clock, session, sound } = startedSession(HR_SLICE, true);
    const views = rowTo(session, clock, 0, 30 * MINUTE + SECOND);
    expect(sound.easeOffsAtMs).toHaveLength(1);
    const rungAt = sound.easeOffsAtMs[0] ?? 0;
    expect(rungAt).toBeGreaterThanOrEqual(PUSH_2_STARTS + 75 * SECOND);
    expect(rungAt).toBeLessThan(PUSH_2_STARTS + 90 * SECOND);
    const glowing = views.filter((view) => view.gauge?.isGlowing === true);
    expect(glowing.length).toBeGreaterThan(0);
    expect(
      glowing.every(
        (view) => view.gauge?.body.kind === 'heart' && view.gauge.body.zone === 'easeOff',
      ),
    ).toBe(true);
  });

  it('hands the sound the cues due next on every tick, then stops once the row is over', () => {
    const { clock, session, sound } = startedSession();
    rowTo(session, clock, 0, 30 * MINUTE - SECOND);
    const hornLookahead = sound.views.find((view) =>
      view.upcomingCues.some((event) => event.type === 'cueDue' && event.cue.kind === 'horn'),
    );
    expect(hornLookahead).toBeDefined();
    const ended = rowTo(session, clock, 30 * MINUTE - SECOND, 30 * MINUTE + SECOND);
    expect(ended.at(-1)?.phase).toBe('complete');
    expect(ended.at(-1)?.summary).toMatchObject({ outcome: 'completed', pushesCompleted: 3 });
    const updatesSoFar = sound.views.length;
    rowTo(session, clock, 0, 5 * SECOND);
    expect(sound.views).toHaveLength(updatesSoFar);
  });

  it('freezes on pause with its reason, and ends as Partly rowed from the pause sheet', () => {
    const { clock, session } = startedSession();
    rowTo(session, clock, 0, 5 * MINUTE);
    session.pause('longPress');
    const paused = rowTo(session, clock, 0, 60 * SECOND);
    expect(paused.at(-1)).toMatchObject({ phase: 'paused', pauseReason: 'longPress' });
    expect(paused.at(-1)?.sessionMs).toBe(paused[0]?.sessionMs);
    session.endSession();
    const ended = session.tick();
    expect(ended.phase).toBe('partlyRowed');
    expect(ended.summary?.outcome).toBe('partlyRowed');
  });
});
