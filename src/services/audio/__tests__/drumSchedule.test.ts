import { timedSegment } from '../../../domain/session/sessionBuilders';
import { segmentTimings, type SessionPlan } from '../../../domain/session/sessionPlan';
import { drumHitsBetween, type DrumHit } from '../drumSchedule';

const SECOND = 1000;
const STROKE_AT_27 = 60_000 / 27;
const STROKE_AT_20 = 60_000 / 20;

function timingsOf(...segments: ReturnType<typeof timedSegment>[]) {
  const plan: SessionPlan = { segments, getSeatedHoldMs: 0, coachingMode: 'effort' };
  return segmentTimings(plan);
}

function catchesOf(hits: readonly DrumHit[]): number[] {
  return hits.filter((hit) => hit.sound === 'drum-catch').map((hit) => hit.atMs);
}

describe('drum schedule', () => {
  const warmUpThenPush = timingsOf(
    timedSegment('warmUp', 10 * SECOND),
    timedSegment('push', 20 * SECOND),
  );

  it('strikes one soft catch per stroke in easy rowing, with no lead-in', () => {
    const hits = drumHitsBetween(warmUpThenPush, [], 0, 7 * SECOND);
    expect(hits.map((hit) => hit.atMs)).toEqual([0, STROKE_AT_20, 2 * STROKE_AT_20]);
    expect(hits.every((hit) => hit.sound === 'drum-catch' && hit.level < 1)).toBe(true);
  });

  it('leads into each catch of a push with two rising taps late in the recovery (tap · tap · BOOM)', () => {
    const secondCatch = 10_000 + STROKE_AT_27;
    const hits = drumHitsBetween(warmUpThenPush, [], 10 * SECOND, secondCatch + 1);
    expect(hits).toEqual([
      { atMs: 10_000, sound: 'drum-catch', level: 1 },
      { atMs: secondCatch - 0.3 * STROKE_AT_27, sound: 'drum-tap', level: 0.45 },
      { atMs: secondCatch - 0.15 * STROKE_AT_27, sound: 'drum-tap', level: 0.55 },
      { atMs: secondCatch, sound: 'drum-catch', level: 1 },
    ]);
  });

  it('changes rate on the first catch of the next segment, which has no lead-in from the segment before', () => {
    const hits = drumHitsBetween(warmUpThenPush, [], 8 * SECOND, 11 * SECOND);
    expect(hits.map((hit) => [hit.atMs, hit.sound])).toEqual([
      [3 * STROKE_AT_20, 'drum-catch'],
      [10_000, 'drum-catch'],
    ]);
  });

  it('skips every hit inside a signal gap, taps included, and comes back on the first hit after it', () => {
    const hornGap = { fromMs: 12 * SECOND, toMs: 17_200 };
    const hits = drumHitsBetween(warmUpThenPush, [hornGap], 10 * SECOND, 20 * SECOND);
    expect(hits.some((hit) => hit.atMs >= hornGap.fromMs && hit.atMs < hornGap.toMs)).toBe(false);
    expect(catchesOf(hits)).toEqual([10_000, 10_000 + 4 * STROKE_AT_27]);
  });

  it('splits into back-to-back windows with no hit lost or doubled, even split exactly at a hit', () => {
    const whole = drumHitsBetween(warmUpThenPush, [], 0, 30 * SECOND);
    const edges = [0, ...whole.map((hit) => hit.atMs), 30 * SECOND];
    const pieces = edges
      .slice(1)
      .flatMap((toMs, index) => drumHitsBetween(warmUpThenPush, [], edges[index] ?? 0, toMs));
    expect(pieces).toEqual(whole);
  });

  it('plays a lead-in only with its own catch, so a push never ends on taps', () => {
    const wholeStrokes = timingsOf(
      timedSegment('push', 9 * STROKE_AT_27),
      timedSegment('rest', 10 * SECOND),
    );
    const partStroke = timingsOf(
      timedSegment('push', 35 * SECOND),
      timedSegment('rest', 10 * SECOND),
    );
    for (const timings of [wholeStrokes, partStroke]) {
      const hits = drumHitsBetween(timings, [], 0, 60 * SECOND);
      const pushEndMs = timings[0]?.endMs ?? 0;
      hits.forEach((hit, index) => {
        if (hit.sound === 'drum-tap') {
          const next = hits.slice(index + 1).find((later) => later.sound === 'drum-catch');
          expect(next?.atMs).toBeLessThan(pushEndMs);
          expect((next?.atMs ?? Infinity) - hit.atMs).toBeLessThanOrEqual(
            0.3 * STROKE_AT_27 + 1e-6,
          );
        }
      });
    }
  });

  it('drops both taps when a signal gap silences the catch they lead into', () => {
    const catchMs = 10_000 + 3 * STROKE_AT_27;
    const gap = { fromMs: catchMs - 0.1 * STROKE_AT_27, toMs: catchMs + 1_000 };
    const hits = drumHitsBetween(
      warmUpThenPush,
      [gap],
      catchMs - STROKE_AT_27 + 1,
      catchMs + 1_100,
    );
    expect(hits).toEqual([]);
  });

  it('is silent before the row starts and after the last segment ends', () => {
    expect(drumHitsBetween(warmUpThenPush, [], -5 * SECOND, 0)).toEqual([]);
    expect(drumHitsBetween(warmUpThenPush, [], 30 * SECOND, 60 * SECOND)).toEqual([]);
  });
});
