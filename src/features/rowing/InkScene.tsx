import {
  Canvas,
  Circle,
  Group,
  Line,
  LinearGradient,
  Path,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { SceneState, SegmentTiming } from '../../domain/session/sessionPlan';
import { useFitTransform, type CanvasSize } from '../../design/useFitTransform';
import { useIsPortrait } from '../../design/useIsPortrait';
import { useReducedMotion } from '../../design/useReducedMotion';
import {
  oarPose,
  sceneClockMs,
  sceneStateAt,
  strokePhaseAt,
  toSceneTimeline,
  type ClockAnchor,
} from '../../services/scene/sceneModel';

// The painting is laid out in board 3.2's frame, then scaled to the screen.
const FRAME: CanvasSize = { width: 844, height: 390 };
// In portrait the scene fills the top of the screen and the gauge band sits below (board 3.2p).
const PORTRAIT_SCENE_SHARE = 0.6;
const HORIZON_Y = 205;

// The slice's palette. Each leg of the voyage brings its own in U18.
const PALETTE = {
  skyTop: '#F7F5EE',
  skyHorizon: '#EEF0EC',
  farHills: '#D4DBD3',
  nearHills: '#B9C8BC',
  water: '#DDE4E5',
  waterLine: '#B7C3C7',
  sun: '#F1D9C3',
  sailStripe: '#BF5D55',
  sailCloth: '#F7F3EA',
  ink: '#2A2522',
  mast: '#4A2B20',
  deck: '#CDB4A9',
  plank: '#A9877A',
  rower: '#3B3532',
  oar: '#7A4A33',
  hornBell: '#C66B22',
};

const PROW = { x: 422, y: 200 };
const BENCH_YS = [232, 262, 298, 346];
// How far each deck edge runs out sideways per point down from the prow.
const DECK_SPREAD = 2.3;
const DECK_FOOT = FRAME.height + 20;

const FAR_HILLS = 'M0 175 C 90 150 170 140 260 152 C 350 164 420 150 520 160 L 520 205 L 0 205 Z';
const NEAR_HILLS = 'M520 205 L 560 150 C 610 60 650 20 700 12 C 760 4 800 30 844 70 L 844 205 Z';
const DECK = `M${PROW.x} ${PROW.y} L 900 ${DECK_FOOT} L -56 ${DECK_FOOT} Z`;
const PROW_NECK = 'M422 205 C 418 150 420 110 446 92 C 462 82 474 86 480 80';
// A lur blown at the prow (R27: "horn at the prow"), shown while the war horn calls a push.
const HORN = 'M436 182 C 446 150 462 126 486 112 L 492 120 C 470 132 456 154 448 184 Z';
const SAIL_STRIPES = [0, 1, 2, 3].map((index) => ({ x: 218 + index * 104, width: 52 }));

function edgeX(y: number, side: -1 | 1): number {
  return PROW.x + side * DECK_SPREAD * (y - PROW.y);
}

type Rower = {
  readonly x: number;
  readonly y: number;
  readonly side: -1 | 1;
  readonly size: number;
};

const ROWERS: Rower[] = BENCH_YS.flatMap((y) => {
  const size = 8 + (y - PROW.y) * 0.16;
  return ([-1, 1] as const).map((side) => ({
    x: edgeX(y, side) - side * size * 1.6,
    y,
    side,
    size,
  }));
});

/**
 * The rowable slice's painting (first pass of U18), drawn in code from boards 3.2–3.4: the striped
 * sail, the dragon prow, the deck and its rowers, and oars that catch on every drum stroke. Scene
 * states follow R27: work digs the oars in, a rest trails them, the horn raises them with a lur at the
 * prow, easy rows calmly under a low sun. The UI thread holds the whole timeline and keeps time from
 * the last session tick, so the oars stay on the drum between ticks and change rate on the exact
 * frame. It holds the catch when paused or under Reduce Motion (R25).
 */
export function InkScene({
  timings,
  sessionMs,
  isRunning,
}: {
  timings: readonly SegmentTiming[];
  sessionMs: number;
  isRunning: boolean;
}) {
  const isPortrait = useIsPortrait();
  const isReducedMotion = useReducedMotion();
  const isMoving = isRunning && isReducedMotion === false;
  const timeline = useMemo(() => toSceneTimeline(timings), [timings]);

  const now = useSharedValue(sessionMs);
  const moving = useSharedValue(isMoving);
  // Each tick's session time, adopted as the clock's anchor on the next UI frame.
  const tick = useSharedValue({ sessionMs, sequence: 0 });
  const anchor = useSharedValue<ClockAnchor>({ sessionMs, frameMs: 0 });
  const adoptedSequence = useSharedValue(-1);
  const sequence = useRef(0);

  const clock = useFrameCallback(({ timestamp }) => {
    const latest = tick.get();
    if (latest.sequence !== adoptedSequence.get()) {
      adoptedSequence.set(latest.sequence);
      anchor.set({ sessionMs: latest.sessionMs, frameMs: timestamp });
    }
    now.set(sceneClockMs(anchor.get(), timestamp, now.get()));
  }, false);

  useEffect(() => {
    sequence.current += 1;
    tick.set({ sessionMs, sequence: sequence.current });
    moving.set(isMoving);
    if (!isMoving) {
      now.set(sessionMs);
    }
    clock.setActive(isMoving);
  }, [clock, isMoving, moving, now, sessionMs, tick]);

  const sceneState = useDerivedValue(() => sceneStateAt(timeline, now.get()));
  const phase = useDerivedValue(() => (moving.get() ? strokePhaseAt(timeline, now.get()) : 0));

  return (
    <View style={isPortrait ? styles.portrait : styles.landscape} pointerEvents="none">
      <ScenePainting fit={isPortrait ? 'width' : 'cover'} sceneState={sceneState} phase={phase} />
    </View>
  );
}

/** The painting itself. It takes only stable shared values, so session ticks never rebuild it. */
const ScenePainting = memo(function ScenePainting({
  fit,
  sceneState,
  phase,
}: {
  fit: 'width' | 'cover';
  sceneState: SharedValue<SceneState>;
  phase: SharedValue<number>;
}) {
  const size = useSharedValue<CanvasSize>(FRAME);
  const transform = useFitTransform(size, FRAME, fit);
  const sunOpacity = useDerivedValue(() => (sceneState.get() === 'easy' ? 1 : 0));
  const hornOpacity = useDerivedValue(() => (sceneState.get() === 'horn' ? 1 : 0));
  return (
    <Canvas style={StyleSheet.absoluteFill} onSize={size}>
      <Group transform={transform}>
        {/* The sky runs far above the frame, so a portrait screen fits the frame's width and fills up. */}
        <Rect
          x={-FRAME.width}
          y={-3 * FRAME.height}
          width={3 * FRAME.width}
          height={3 * FRAME.height + HORIZON_Y}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, HORIZON_Y)}
            colors={[PALETTE.skyTop, PALETTE.skyHorizon]}
          />
        </Rect>
        <Circle cx={700} cy={150} r={34} color={PALETTE.sun} opacity={sunOpacity} />
        <Path path={FAR_HILLS} color={PALETTE.farHills} />
        <Path path={NEAR_HILLS} color={PALETTE.nearHills} />
        <Rect
          x={-FRAME.width}
          y={HORIZON_Y - 5}
          width={3 * FRAME.width}
          height={FRAME.height}
          color={PALETTE.water}
        />
        {[230, 268].map((y) => (
          <Line
            key={y}
            p1={vec(30, y)}
            p2={vec(170, y)}
            color={PALETTE.waterLine}
            strokeWidth={1.5}
          />
        ))}
        <Path path={DECK} color={PALETTE.deck} />
        {[-0.6, -0.25, 0.25, 0.6].map((share) => (
          <Line
            key={share}
            p1={vec(PROW.x, PROW.y + 6)}
            p2={vec(PROW.x + share * 520, DECK_FOOT)}
            color={PALETTE.plank}
            strokeWidth={1}
          />
        ))}
        {BENCH_YS.map((y) => (
          <Line
            key={y}
            p1={vec(edgeX(y, -1), y)}
            p2={vec(edgeX(y, 1), y)}
            color={PALETTE.plank}
            strokeWidth={2 + (y - PROW.y) * 0.03}
          />
        ))}
        {([-1, 1] as const).map((side) => (
          <Line
            key={side}
            p1={vec(PROW.x, PROW.y)}
            p2={vec(edgeX(DECK_FOOT, side), DECK_FOOT)}
            color={PALETTE.ink}
            strokeWidth={9}
            strokeCap="round"
          />
        ))}
        <Line p1={vec(PROW.x, 170)} p2={vec(PROW.x, 320)} color={PALETTE.mast} strokeWidth={4} />
        <Path
          path={PROW_NECK}
          color={PALETTE.ink}
          style="stroke"
          strokeWidth={9}
          strokeCap="round"
        />
        <Group opacity={hornOpacity}>
          <Path path={HORN} color={PALETTE.ink} />
          <Circle cx={489} cy={116} r={7} color={PALETTE.hornBell} />
        </Group>
        {ROWERS.map((rower) => (
          <Oar
            key={`${rower.y}${rower.side}`}
            rower={rower}
            phase={phase}
            sceneState={sceneState}
          />
        ))}
        {ROWERS.map((rower) => (
          <Circle
            key={`${rower.y}${rower.side}`}
            cx={rower.x}
            cy={rower.y - rower.size * 0.4}
            r={rower.size}
            color={PALETTE.rower}
            opacity={0.88}
          />
        ))}
        <Rect x={196} y={-10} width={440} height={86} color={PALETTE.sailCloth} />
        {SAIL_STRIPES.map((stripe) => (
          <Rect
            key={stripe.x}
            x={stripe.x}
            y={-10}
            width={stripe.width}
            height={86}
            color={PALETTE.sailStripe}
          />
        ))}
        <Rect
          x={196}
          y={-10}
          width={440}
          height={86}
          color={PALETTE.ink}
          style="stroke"
          strokeWidth={2}
        />
      </Group>
    </Canvas>
  );
});

/**
 * One oar, from the rower's hands out over the water. Its tip turns every frame on the UI thread:
 * swept fore and aft through the stroke, and raised by its elevation, at a fixed length.
 */
function Oar({
  rower,
  phase,
  sceneState,
}: {
  rower: Rower;
  phase: SharedValue<number>;
  sceneState: SharedValue<SceneState>;
}) {
  const length = 70 + (rower.y - PROW.y) * 1.1;
  const tip = useDerivedValue(() => {
    const { sweep, elevation } = oarPose(sceneState.get(), phase.get());
    const reach = length * Math.cos(elevation);
    // Out over the side, then fore (up the screen) and aft, and up off the water.
    return {
      x: rower.x + rower.side * reach * Math.cos(sweep),
      y: rower.y + reach * Math.sin(sweep) * 0.45 - length * Math.sin(elevation) * 0.85,
    };
  });
  return (
    <Line
      p1={vec(rower.x, rower.y)}
      p2={tip}
      color={PALETTE.oar}
      strokeWidth={2 + rower.size * 0.22}
      strokeCap="round"
    />
  );
}

const styles = StyleSheet.create({
  landscape: { ...StyleSheet.absoluteFill },
  portrait: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: `${PORTRAIT_SCENE_SHARE * 100}%`,
  },
});
