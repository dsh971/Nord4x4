import { timedSegment } from '../../../domain/session/sessionBuilders';
import { segmentTimings, type SessionPlan } from '../../../domain/session/sessionPlan';
import { drumHitsBetween } from '../../audio/drumSchedule';
import { oarPose, sceneClockMs, sceneStateAt, strokePhaseAt, toSceneTimeline } from '../sceneModel';

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// Segment lengths that aren't whole strokes, so the grid restarts mid-stroke at each boundary.
const PLAN: SessionPlan = {
  segments: [
    timedSegment('warmUp', 2 * MINUTE + 1_300),
    timedSegment('pickup', 20 * SECOND),
    timedSegment('warmUp', MINUTE),
    timedSegment('push', 3 * MINUTE, { lowPercentOfMax: 85, highPercentOfMax: 90 }),
    timedSegment('rest', 3 * MINUTE),
    timedSegment('coolDown', 5 * MINUTE),
  ],
  getSeatedHoldMs: 20 * SECOND,
  coachingMode: 'effort',
};
const TIMINGS = segmentTimings(PLAN);
const TIMELINE = toSceneTimeline(TIMINGS);
const PUSH_STARTS = 2 * MINUTE + 1_300 + 20 * SECOND + MINUTE;
const ROW_ENDS = PUSH_STARTS + 11 * MINUTE;

describe('sceneStateAt (R27)', () => {
  it('paints each segment by its scene: warm-up easy, pickup and push work, rest rest', () => {
    expect(sceneStateAt(TIMELINE, 30 * SECOND)).toBe('easy');
    expect(sceneStateAt(TIMELINE, 2 * MINUTE + 5 * SECOND)).toBe('work');
    expect(sceneStateAt(TIMELINE, PUSH_STARTS + MINUTE)).toBe('work');
    expect(sceneStateAt(TIMELINE, PUSH_STARTS + 4 * MINUTE)).toBe('rest');
    expect(sceneStateAt(TIMELINE, PUSH_STARTS + 7 * MINUTE)).toBe('easy');
  });

  it('raises the oars while the war horn calls a push, but not before a pickup', () => {
    expect(sceneStateAt(TIMELINE, PUSH_STARTS - 10 * SECOND)).toBe('horn');
    expect(sceneStateAt(TIMELINE, PUSH_STARTS - 10 * SECOND - 1)).toBe('easy');
    expect(sceneStateAt(TIMELINE, 2 * MINUTE - 5 * SECOND)).toBe('easy');
  });

  it('is calm during Get seated and after the row', () => {
    expect(sceneStateAt(TIMELINE, -5 * SECOND)).toBe('easy');
    expect(sceneStateAt(TIMELINE, ROW_ENDS + MINUTE)).toBe('easy');
  });
});

describe('strokePhaseAt', () => {
  it('is at the catch on every catch the drum strikes, across every segment boundary', () => {
    const catches = drumHitsBetween(TIMINGS, [], 0, ROW_ENDS).flatMap((hit) =>
      hit.sound === 'drum-catch' ? [hit.atMs] : [],
    );
    expect(catches.length).toBeGreaterThan(200);
    for (const atMs of catches) {
      const phase = strokePhaseAt(TIMELINE, atMs);
      expect(Math.min(phase, 1 - phase)).toBeLessThan(1e-6);
    }
  });

  it('is halfway through a 27 spm push stroke 1.11 s after a catch, and nearly done just before the next', () => {
    const strokeMs = 60_000 / 27;
    expect(strokePhaseAt(TIMELINE, PUSH_STARTS + strokeMs / 2)).toBeCloseTo(0.5, 6);
    expect(strokePhaseAt(TIMELINE, PUSH_STARTS + strokeMs * 0.995)).toBeCloseTo(0.995, 6);
  });

  it('holds the catch before the row starts and after it ends', () => {
    expect(strokePhaseAt(TIMELINE, -2_500)).toBe(0);
    expect(strokePhaseAt(TIMELINE, ROW_ENDS + 1_500)).toBe(0);
  });
});

describe('oarPose', () => {
  it('sweeps the oars through the stroke when working, further than in easy rowing', () => {
    const swept = (scene: 'work' | 'easy') =>
      Math.abs(oarPose(scene, 0).sweep - oarPose(scene, 0.35).sweep);
    expect(swept('work')).toBeGreaterThan(swept('easy'));
    expect(swept('easy')).toBeGreaterThan(0);
  });

  it('moves smoothly: no jump where the drive ends or where the stroke wraps to the catch', () => {
    const boundaries: [number, number][] = [
      [0.35 - 1e-6, 0.35 + 1e-6],
      [1 - 1e-6, 0],
    ];
    for (const scene of ['work', 'easy'] as const) {
      for (const [before, after] of boundaries) {
        const a = oarPose(scene, before);
        const b = oarPose(scene, after);
        expect(Math.abs(a.sweep - b.sweep)).toBeLessThan(1e-3);
        expect(Math.abs(a.elevation - b.elevation)).toBeLessThan(1e-3);
      }
    }
  });

  it('lifts the blades off the water on the recovery, not on the drive', () => {
    expect(oarPose('work', 0.2).elevation).toBeLessThan(oarPose('work', 0.65).elevation);
  });

  it('holds the oars nearly upright for the horn, and still and trailing in a rest', () => {
    expect(oarPose('horn', 0)).toEqual(oarPose('horn', 0.6));
    expect(oarPose('horn', 0).elevation).toBeGreaterThan(1);
    expect(oarPose('rest', 0)).toEqual(oarPose('rest', 0.3));
  });
});

describe('sceneClockMs', () => {
  it('runs on from the last session time it was handed, by the frames since', () => {
    expect(sceneClockMs({ sessionMs: 600_000, frameMs: 1_000 }, 1_050, 600_040)).toBe(600_050);
  });

  it('never steps back under a late tick, but follows a seek', () => {
    expect(sceneClockMs({ sessionMs: 600_000, frameMs: 1_000 }, 1_000, 600_080)).toBe(600_080);
    expect(sceneClockMs({ sessionMs: 300_000, frameMs: 1_000 }, 1_000, 600_080)).toBe(300_000);
  });
});
