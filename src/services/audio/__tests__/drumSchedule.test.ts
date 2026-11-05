import { timedSegment } from '../../../domain/session/sessionBuilders';
import { segmentTimings, type SessionPlan } from '../../../domain/session/sessionPlan';
import { drumHitsBetween } from '../drumSchedule';

const SECOND = 1000;
const STROKE_AT_27 = 60_000 / 27;
const STROKE_AT_20 = 60_000 / 20;

function timingsOf(...segments: ReturnType<typeof timedSegment>[]) {
  const plan: SessionPlan = { segments, getSeatedHoldMs: 0, coachingMode: 'effort' };
  return segmentTimings(plan);
}

describe('drum schedule', () => {
  const warmUpThenPush = timingsOf(
    timedSegment('warmUp', 10 * SECOND),
    timedSegment('push', 20 * SECOND),
  );

  it('strikes once per stroke from the start of a segment, at its rate', () => {
    const hits = drumHitsBetween(warmUpThenPush, [], 10 * SECOND, 16 * SECOND);
    expect(hits).toEqual([10_000, 10_000 + STROKE_AT_27, 10_000 + 2 * STROKE_AT_27]);
  });

  it('changes rate on the first stroke of the next segment', () => {
    const hits = drumHitsBetween(warmUpThenPush, [], 8 * SECOND, 11 * SECOND);
    expect(hits).toEqual([3 * STROKE_AT_20, 10_000]);
  });

  it('skips the strokes inside a signal gap and comes back on the first stroke after it', () => {
    const hornGap = { fromMs: 12 * SECOND, toMs: 17_200 };
    const hits = drumHitsBetween(warmUpThenPush, [hornGap], 10 * SECOND, 20 * SECOND);
    expect(hits).toEqual([10_000, 10_000 + 4 * STROKE_AT_27]);
  });

  it('splits into back-to-back windows with no stroke lost or doubled', () => {
    const whole = drumHitsBetween(warmUpThenPush, [], 0, 30 * SECOND);
    const windows: [number, number][] = [
      [0, 7_300],
      [7_300, 10_000],
      [10_000, 19_999],
      [19_999, 30_000],
    ];
    const pieces = windows.flatMap(([fromMs, toMs]) =>
      drumHitsBetween(warmUpThenPush, [], fromMs, toMs),
    );
    expect(pieces).toEqual(whole);
  });

  it('is silent before the row starts and after the last segment ends', () => {
    expect(drumHitsBetween(warmUpThenPush, [], -5 * SECOND, 0)).toEqual([]);
    expect(drumHitsBetween(warmUpThenPush, [], 30 * SECOND, 60 * SECOND)).toEqual([]);
  });
});
