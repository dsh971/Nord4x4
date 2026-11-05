import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../tokens';
import { isWork, SegmentBars, type BarSegment } from './SegmentBars';

const BAR_HEIGHT = 18;
const EASY_HEIGHT = 10;

type Position = { activeIndex: number; rowedShare: number; sessionShare: number };

/** Which segment `elapsedMs` falls in and how much of it is rowed; past the end, the last one, full. */
function locate(segments: readonly BarSegment[], elapsedMs: number): Position {
  const totalMs = segments.reduce((sum, segment) => sum + segment.durationMs, 0);
  const sessionShare = totalMs > 0 ? Math.min(1, Math.max(0, elapsedMs / totalMs)) : 0;
  let startMs = 0;
  for (const [index, segment] of segments.entries()) {
    if (elapsedMs < startMs + segment.durationMs) {
      return {
        activeIndex: index,
        rowedShare: Math.max(0, (elapsedMs - startMs) / segment.durationMs),
        sessionShare,
      };
    }
    startMs += segment.durationMs;
  }
  return { activeIndex: segments.length - 1, rowedShare: 1, sessionShare };
}

/** Says where the rower is, e.g. "push 2 of 3 in progress", for VoiceOver. */
function describe(segments: readonly BarSegment[], { activeIndex, rowedShare }: Position): string {
  const active = segments[activeIndex];
  if (!active || (activeIndex === segments.length - 1 && rowedShare >= 1)) {
    return 'Session progress: complete';
  }
  const pushes = segments.filter((segment) => segment.kind === 'push');
  const where =
    active.kind === 'push'
      ? `push ${pushes.indexOf(active) + 1} of ${pushes.length}`
      : active.kind === 'pickup'
        ? 'a pickup'
        : active.kind === 'rest'
          ? 'rest'
          : 'easy rowing';
  return `Session progress: ${where} in progress`;
}

/**
 * Every segment of the session, pickups included, with a marker for now (R31). Work is full height
 * and easy rowing shorter, so the strip doesn't rely on colour. As on board 3.2, the marker sits
 * inside the segment being rowed, so it always meets the edge of the fill.
 */
export function ProgressStrip({
  segments,
  elapsedMs,
}: {
  segments: readonly BarSegment[];
  elapsedMs: number;
}) {
  const position = locate(segments, elapsedMs);
  return (
    <View
      style={styles.frame}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={describe(segments, position)}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(position.sessionShare * 100) }}
    >
      <SegmentBars
        segments={segments}
        height={BAR_HEIGHT}
        testID="strip-segment"
        barStyle={(segment) => ({
          height: isWork(segment.kind) ? BAR_HEIGHT : EASY_HEIGHT,
          backgroundColor: isWork(segment.kind) ? colors.pushAhead : colors.steadyAhead,
        })}
        renderInside={(segment, index) => {
          if (index > position.activeIndex) {
            return null;
          }
          const rowedShare = index < position.activeIndex ? 1 : position.rowedShare;
          const fill = isWork(segment.kind) ? colors.push : colors.steady;
          return (
            <>
              <View
                style={[styles.rowed, { width: `${rowedShare * 100}%`, backgroundColor: fill }]}
              />
              {index === position.activeIndex ? (
                <View testID="strip-now" style={[styles.now, { left: `${rowedShare * 100}%` }]} />
              ) : null}
            </>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 28,
    padding: 4,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.chip,
  },
  rowed: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  now: {
    position: 'absolute',
    bottom: -4,
    height: 26,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: colors.ink,
  },
});
