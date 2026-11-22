import { SLICE_PLAN } from '../../../content/slicePlan';
import { FAKE_MAX_HEART_RATE, fakeHeartRate } from '../../../dev/fakeHeartTrace';
import { HR_SLICE, MINUTE, PUSH_2_STARTS, SECOND } from '../../../dev/rowingStates/sliceMoments';
import { rowFreelyPlan } from '../../../domain/session/__tests__/fixtures';
import { ManualClock } from '../../../domain/session/clock';
import { segmentTimings } from '../../../domain/session/sessionPlan';
import type { SessionView } from '../../../services/audio/audioEngine';
import { WARNING_BANNERS } from '../banners';
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
  it('keeps "Ready oars" up from the warning through the horn, then shows "Pull" for 3 s', () => {
    const { clock, session } = startedSession();
    const warningAtMs = PUSH_2_STARTS - 13 * SECOND;
    rowTo(session, clock, 0, warningAtMs);
    const afterHorn = rowTo(session, clock, warningAtMs, PUSH_2_STARTS - 5 * SECOND);
    expect(afterHorn.at(-1)?.banner).toEqual({ text: 'Ready oars', hasEdgePulse: true });
    const pushStart = rowTo(session, clock, PUSH_2_STARTS - 5 * SECOND, PUSH_2_STARTS + 2_900);
    expect(pushStart.at(-1)?.banner?.text).toBe('Pull');
    const after = rowTo(session, clock, PUSH_2_STARTS + 2_900, PUSH_2_STARTS + 3_200);
    expect(after.at(-1)?.banner).toBeNull();
  });

  it('announces a warm-up pickup: "Pickup coming" through its horn, then "Pickup", then "Back to easy"', () => {
    const { clock, session } = startedSession();
    const pickupStarts = 5 * MINUTE;
    const afterHorn = rowTo(session, clock, 0, pickupStarts - 5 * SECOND);
    expect(afterHorn.at(-1)?.banner).toEqual({ text: 'Pickup coming', hasEdgePulse: true });
    const start = rowTo(session, clock, pickupStarts - 5 * SECOND, pickupStarts + 500);
    expect(start.at(-1)?.banner?.text).toBe('Pickup');
    const end = rowTo(session, clock, pickupStarts + 500, pickupStarts + 20_500);
    expect(end.at(-1)?.banner?.text).toBe('Back to easy');
  });

  it.each([
    ['push 2', PUSH_2_STARTS, 'Ready oars', 'Pull'],
    ['pickup 1', 5 * MINUTE, 'Pickup coming', 'Pickup'],
  ])(
    'shows the warning before %s from 13 s to 3 s ahead, then a clear screen until the start banner (G6e)',
    (_, startMs, warning, start) => {
      const { clock, session } = startedSession();
      const views = rowTo(session, clock, 0, startMs + 500);
      const textAt = (sessionMs: number) => {
        const view = views.find((candidate) => candidate.sessionMs === sessionMs);
        expect(view).toBeDefined();
        return view?.banner?.text ?? null;
      };
      expect(textAt(startMs - 13_100)).toBeNull();
      expect(textAt(startMs - 13_000)).toBe(warning);
      expect(textAt(startMs - 3_100)).toBe(warning);
      expect(textAt(startMs - 3_000)).toBeNull();
      expect(textAt(startMs - 100)).toBeNull();
      expect(textAt(startMs)).toBe(start);
    },
  );

  it('shows the warning from 13 s to 3 s before every push and pickup of the slice, then a clear screen until the start', () => {
    const { clock, session } = startedSession();
    const timings = segmentTimings(SLICE_PLAN);
    const work = timings.filter(
      ({ segment }) => segment.type === 'push' || segment.type === 'pickup',
    );
    const views = rowTo(session, clock, 0, timings.at(-1)?.endMs ?? 0);
    expect(work.length).toBeGreaterThanOrEqual(5);
    for (const view of views) {
      const coming = work.find(
        ({ startMs }) => view.sessionMs >= startMs - 13_000 && view.sessionMs < startMs,
      );
      if (coming === undefined) {
        const isWarning = Object.values(WARNING_BANNERS).some(
          ({ text }) => text === view.banner?.text,
        );
        expect([view.sessionMs, isWarning]).toEqual([view.sessionMs, false]);
      } else if (view.sessionMs < coming.startMs - 3_000) {
        expect([view.sessionMs, view.banner]).toEqual([
          view.sessionMs,
          WARNING_BANNERS[coming.segment.type === 'push' ? 'push' : 'pickup'],
        ]);
      } else {
        expect([view.sessionMs, view.banner]).toEqual([view.sessionMs, null]);
      }
    }
  });

  it('shows "Ready oars" when a stall jumps past the moment its warning starts', () => {
    const { clock, session } = startedSession();
    rowTo(session, clock, 0, PUSH_2_STARTS - 14 * SECOND);
    clock.advanceBy(4 * SECOND);
    expect(session.tick().banner).toEqual({ text: 'Ready oars', hasEdgePulse: true });
  });

  it('clears "Ready oars" when a stall jumps into the last 3 s before the push', () => {
    const { clock, session } = startedSession();
    rowTo(session, clock, 0, PUSH_2_STARTS - 8 * SECOND);
    clock.advanceBy(6 * SECOND);
    expect(session.tick().banner).toBeNull();
  });

  it('hides the warning under the pause sheet and shows it again on resume', () => {
    const { clock, session } = startedSession();
    rowTo(session, clock, 0, PUSH_2_STARTS - 8 * SECOND);
    session.pause('longPress');
    expect(session.tick().banner).toBeNull();
    session.resume();
    expect(session.tick().banner).toEqual({ text: 'Ready oars', hasEdgePulse: true });
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

  it('gives the session time left: the whole session in Get seated, and none for Row freely', () => {
    const clock = new ManualClock();
    const seated = new RowingSession(SLICE_PLAN, clock, null);
    expect(seated.tick().sessionRemainingMs).toBe(30 * MINUTE);
    seated.startNow();
    clock.advanceBy(4 * MINUTE + 50 * SECOND);
    expect(seated.tick().sessionRemainingMs).toBe(25 * MINUTE + 10 * SECOND);
    expect(new RowingSession(rowFreelyPlan(), clock, null).tick().sessionRemainingMs).toBeNull();
  });

  it('drives no sound once its sound is cleared, while the row keeps time', () => {
    const { clock, session, sound } = startedSession();
    rowTo(session, clock, 0, 4 * MINUTE);
    session.setSound(null);
    const updatesSoFar = sound.views.length;
    const away = rowTo(session, clock, 4 * MINUTE, 6 * MINUTE);
    expect(sound.views).toHaveLength(updatesSoFar);
    expect(away.at(-1)?.sessionMs).toBe(6 * MINUTE);
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
