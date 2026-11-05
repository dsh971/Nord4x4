import { Canvas, Group, Path } from '@shopify/react-native-skia';

import { colors } from '../tokens';

// The longship from the boards' header (64 × 40 viewBox): hull, prow, stern, mast and sail.
const SHIP_PATH =
  'M4 24 Q32 38 60 24 M4 24 Q2 14 8 10 M60 24 Q62 14 56 10 M32 28V4 M20 6h24v14H20z';
const VIEWBOX_WIDTH = 64;
const VIEWBOX_HEIGHT = 40;

/** The ship mark that stands in for the Shuimo seal: on the route, and beside the app name. */
export function ShipIcon({ width = 30 }: { width?: number }) {
  const scale = width / VIEWBOX_WIDTH;
  return (
    <Canvas
      style={{ width, height: VIEWBOX_HEIGHT * scale }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Group transform={[{ scale }]}>
        <Path
          path={SHIP_PATH}
          style="stroke"
          strokeWidth={3}
          strokeCap="round"
          strokeJoin="round"
          color={colors.ink}
        />
      </Group>
    </Canvas>
  );
}
