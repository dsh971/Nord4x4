import { View } from 'react-native';

import { colors } from '../tokens';
import { isWork, SegmentBars, type BarKind, type BarSegment } from './SegmentBars';

const SHAPE_HEIGHT = 40;
// Heights from the Today card on board 2.1: height, not colour, tells work from the rest of the row.
const HEIGHTS: Record<BarKind, number> = {
  push: SHAPE_HEIGHT,
  pickup: SHAPE_HEIGHT,
  rest: 16,
  easy: 10,
};

/** A session's outline at a glance: one bar per segment, widths by length, work tallest. */
export function IntervalShape({ segments }: { segments: readonly BarSegment[] }) {
  if (segments.length === 0) {
    return null;
  }
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SegmentBars
        segments={segments}
        height={SHAPE_HEIGHT}
        testID="interval-bar"
        barStyle={(segment) => ({
          height: HEIGHTS[segment.kind],
          backgroundColor: isWork(segment.kind) ? colors.push : colors.steady,
        })}
      />
    </View>
  );
}
