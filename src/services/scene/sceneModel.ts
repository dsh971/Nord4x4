import { isHornCalling } from '../../domain/session/sessionMachine';
import type { SceneState, SegmentTiming } from '../../domain/session/sessionPlan';

/**
 * The session's segments as plain data the UI thread can hold, so the painting looks up its scene and
 * stroke on every frame without waiting on the JS thread. Row freely's open end is Infinity.
 */
export type SceneTimeline = {
  readonly segments: readonly {
    readonly startMs: number;
    readonly endMs: number;
    readonly strokesPerMinute: number;
    readonly scene: SceneState;
  }[];
  readonly pushStartsMs: readonly number[];
};

/** How the oars sit: `sweep` swings them fore (negative) and aft, `elevation` raises them (radians). */
export type OarPose = { readonly sweep: number; readonly elevation: number };

/** Where the UI clock was last told the session stood: session time, and the frame it arrived on. */
export type ClockAnchor = { readonly sessionMs: number; readonly frameMs: number };

// The drive takes about a third of a stroke, the recovery the rest, as in a real stroke.
const DRIVE_SHARE = 0.35;
// A blade in the water angles down from the oarlock; for the horn the oars stand nearly upright.
const BLADE_IN_WATER = -0.25;
const OARS_RAISED = 1.15;
// The UI clock holds its time rather than step back for a late tick; a bigger jump is a real seek.
const SEEK_MS = 1_000;

/** The session's segments as a timeline the painting can read on the UI thread. */
export function toSceneTimeline(timings: readonly SegmentTiming[]): SceneTimeline {
  return {
    segments: timings.map(({ segment, startMs, endMs }) => ({
      startMs,
      endMs: endMs ?? Infinity,
      strokesPerMinute: segment.strokesPerMinute,
      scene: segment.scene,
    })),
    pushStartsMs: timings.flatMap(({ segment, startMs }) =>
      segment.type === 'push' ? [startMs] : [],
    ),
  };
}

function segmentIndexAt(timeline: SceneTimeline, sessionMs: number): number {
  'worklet';
  for (let index = 0; index < timeline.segments.length; index += 1) {
    const segment = timeline.segments[index];
    if (segment !== undefined && sessionMs >= segment.startMs && sessionMs < segment.endMs) {
      return index;
    }
  }
  return -1;
}

/**
 * The scene state for a moment of the session (R27): each segment's own scene, except while the war
 * horn calls a push, when the oars are raised. Before and after the row the sea is calm.
 */
export function sceneStateAt(timeline: SceneTimeline, sessionMs: number): SceneState {
  'worklet';
  const segment = timeline.segments[segmentIndexAt(timeline, sessionMs)];
  if (segment === undefined) {
    return 'easy';
  }
  return isHornCalling(timeline.pushStartsMs, sessionMs) ? 'horn' : segment.scene;
}

/**
 * Where the rowers are in their stroke, 0 at the catch rising to 1, on the drum's grid: one stroke
 * from each segment's start at its rate. Before and after the row the oars hold the catch.
 */
export function strokePhaseAt(timeline: SceneTimeline, sessionMs: number): number {
  'worklet';
  const segment = timeline.segments[segmentIndexAt(timeline, sessionMs)];
  if (segment === undefined) {
    return 0;
  }
  const strokes = ((sessionMs - segment.startMs) * segment.strokesPerMinute) / 60_000;
  // A hair under a whole stroke is that stroke's catch, not the end of the last one.
  return Math.max(0, strokes - Math.floor(strokes + 1e-9));
}

/**
 * How the oars sit for a scene state and stroke phase. Work digs a long stroke and easy rowing a
 * short one, lifting the blades through the recovery and setting them down at the catch without a
 * jump; a rest trails the oars, and the horn holds them nearly upright.
 */
export function oarPose(scene: SceneState, phase: number): OarPose {
  'worklet';
  const isDrive = phase < DRIVE_SHARE;
  const swing = isDrive ? phase / DRIVE_SHARE : 1 - (phase - DRIVE_SHARE) / (1 - DRIVE_SHARE);
  const recovery = isDrive ? 0 : Math.sin((Math.PI * (phase - DRIVE_SHARE)) / (1 - DRIVE_SHARE));
  switch (scene) {
    case 'horn':
      return { sweep: 0, elevation: OARS_RAISED };
    case 'rest':
      return { sweep: 0.5, elevation: -0.1 };
    case 'work':
    case 'rough':
      return { sweep: -0.45 + 0.9 * swing, elevation: BLADE_IN_WATER + 0.35 * recovery };
    case 'easy':
    case 'swell':
      return { sweep: -0.25 + 0.5 * swing, elevation: BLADE_IN_WATER + 0.2 * recovery };
  }
}

/**
 * The session time to paint on a frame: the anchor's time plus the frames since it arrived. It holds
 * rather than step back for a late JS tick, and follows a real seek.
 */
export function sceneClockMs(anchor: ClockAnchor, frameMs: number, previousMs: number): number {
  'worklet';
  const nowMs = anchor.sessionMs + (frameMs - anchor.frameMs);
  return nowMs < previousMs && previousMs - nowMs < SEEK_MS ? previousMs : nowMs;
}
