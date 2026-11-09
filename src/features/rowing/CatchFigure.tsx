import { Canvas, Circle, Group, Line, Rect, vec } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../design/tokens';
import { fitTransform, useLayoutSize, type CanvasSize } from '../../design/fitTransform';
import { CATCH_FIGURE_LABEL } from './copy';

// The figure is drawn in this frame, then scaled to fit the space Get seated gives it.
const FRAME: CanvasSize = { width: 300, height: 180 };

// The rower faces the flywheel (right): seat and hips at the back, feet on the footplate at the
// front, shins upright, body leaning over the knees, arms long to the handle.
const JOINTS = {
  hip: vec(112, 150),
  knee: vec(192, 70),
  ankle: vec(196, 146),
  shoulder: vec(170, 62),
  head: vec(182, 38),
  handle: vec(236, 96),
};
const FLYWHEEL = vec(262, 118);

/**
 * The catch, drawn still (R23, R25, board 3.1a): shins vertical, arms long, body over the knees,
 * reaching for the handle. The stroke demo animates through all four phases in U17.
 */
export function CatchFigure() {
  const [size, onLayout] = useLayoutSize();
  return (
    <View
      style={styles.box}
      accessible
      accessibilityRole="image"
      accessibilityLabel={CATCH_FIGURE_LABEL}
      testID="catch-figure"
      onLayout={onLayout}
    >
      {size === null ? null : (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={fitTransform(size, FRAME, 'contain')}>
            <Line
              p1={vec(16, 170)}
              p2={vec(290, 170)}
              color={colors.machine}
              strokeWidth={4}
              strokeCap="round"
            />
            <Rect x={92} y={156} width={44} height={8} color={colors.machine} />
            <Circle c={FLYWHEEL} r={34} color={colors.machine} style="stroke" strokeWidth={3} />
            <Line p1={JOINTS.handle} p2={FLYWHEEL} color={colors.machine} strokeWidth={2} />
            <Rect x={186} y={148} width={30} height={8} color={colors.push} />
            <Group color={colors.ink} style="stroke" strokeWidth={9} strokeCap="round">
              <Line p1={JOINTS.ankle} p2={JOINTS.knee} />
              <Line p1={JOINTS.knee} p2={JOINTS.hip} />
              <Line p1={JOINTS.hip} p2={JOINTS.shoulder} />
              <Line p1={JOINTS.shoulder} p2={JOINTS.handle} />
            </Group>
            <Circle c={JOINTS.head} r={15} color={colors.ink} />
          </Group>
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, minHeight: 96 },
});
