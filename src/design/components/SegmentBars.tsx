import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

/**
 * How a segment is drawn: a push, a pickup inside the warm-up, a rest between pushes, or easy
 * rowing (warm-up, cool-down, steady). Pushes and pickups are work; the rest is not.
 */
export type BarKind = 'push' | 'pickup' | 'rest' | 'easy';

/** One bar: its kind and how long its segment lasts. */
export type BarSegment = { kind: BarKind; durationMs: number };

/** Whether a bar is work (push or pickup), which the boards draw tall and in persimmon. */
export function isWork(kind: BarKind): boolean {
  return kind === 'push' || kind === 'pickup';
}

/**
 * A row of bars, one per segment, each as wide as its share of the session. The caller styles
 * each bar and may draw inside it (the progress strip's fill and marker).
 */
export function SegmentBars({
  segments,
  height,
  barStyle,
  renderInside,
  testID,
}: {
  segments: readonly BarSegment[];
  height: number;
  barStyle: (segment: BarSegment, index: number) => ViewStyle;
  renderInside?: (segment: BarSegment, index: number) => ReactNode;
  testID: string;
}) {
  return (
    <View style={[styles.row, { height }]}>
      {segments.map((segment, index) => (
        <View
          // A plan never reorders, so a bar's position is a stable key.
          key={index}
          testID={testID}
          style={[styles.bar, { flexGrow: segment.durationMs }, barStyle(segment, index)]}
        >
          {renderInside?.(segment, index)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { flexBasis: 0 },
});
