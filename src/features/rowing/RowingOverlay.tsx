import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressStrip } from '../../design/components/ProgressStrip';
import type { BarSegment } from '../../design/components/SegmentBars';
import { Text } from '../../design/components/Text';
import { colors, radius, space } from '../../design/tokens';
import { useIsPortrait } from '../../design/useIsPortrait';
import type { Banner } from './banners';
import { CornerGauge } from './CornerGauge';
import { EdgeGlow } from './EdgeGlow';
import { formatClock, type GaugeModel } from './gaugeModel';
import { SignalBanner } from './SignalBanner';

// How long a press must last to pause: long enough that a stray touch at the catch doesn't (R32).
const PAUSE_PRESS_MS = 600;
const PAUSE_LABEL = 'Hold anywhere to pause';

/**
 * Everything drawn over the scene while rowing: the gauge, the current signal's banner, the labels
 * and the progress strip. Landscape follows board 3.2, with the gauge in its own column down to the
 * strip; portrait follows board 3.2p, with the gauge as a band above the labels. It sits inside the
 * safe area, clear of the camera cut-out and the home indicator, while the edge glows run to the
 * screen's edge. A long press anywhere pauses; VoiceOver users pause from the pause label instead.
 */
export function RowingOverlay({
  gauge,
  bars,
  banner,
  onPause,
}: {
  gauge: GaugeModel;
  bars: readonly BarSegment[];
  banner: Banner | null;
  onPause: () => void;
}) {
  const isPortrait = useIsPortrait();
  const bannerView = banner ? <SignalBanner banner={banner} /> : null;
  const labels = (
    <View style={styles.labels}>
      <Text
        variant="bodyLarge"
        style={styles.label}
        accessibilityRole="button"
        accessibilityLabel={PAUSE_LABEL}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate') {
            onPause();
          }
        }}
      >
        {PAUSE_LABEL}
      </Text>
      {gauge.sessionLeftMs !== null ? (
        <Text variant="bodyLarge" style={styles.label} testID="session-left">
          Session · {formatClock(gauge.sessionLeftMs)} left
        </Text>
      ) : null}
    </View>
  );
  return (
    // Not one accessible element, or VoiceOver would merge the gauge, banner and strip into one.
    <Pressable
      style={styles.screen}
      onLongPress={onPause}
      delayLongPress={PAUSE_PRESS_MS}
      accessible={false}
      testID="rowing-overlay"
    >
      {gauge.isGlowing ? <EdgeGlow tone="easeOff" testID="ease-off-glow" /> : null}
      {banner?.hasEdgePulse ? <EdgeGlow tone="horn" testID="horn-edge-pulse" /> : null}
      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {isPortrait ? (
          <>
            <View style={styles.middle} pointerEvents="box-none">
              {bannerView}
            </View>
            <CornerGauge gauge={gauge} isBand />
            {labels}
          </>
        ) : (
          <View style={styles.main} pointerEvents="box-none">
            <View style={styles.side} pointerEvents="box-none">
              <View style={styles.middle} pointerEvents="box-none">
                {bannerView}
              </View>
              {/* Beside the gauge, not in it: the panel has no height left in landscape. */}
              {gauge.note ? (
                <Text
                  variant="bodyStrong"
                  color="textSteady"
                  style={styles.label}
                  testID="side-note"
                >
                  {gauge.note}
                </Text>
              ) : null}
              {labels}
            </View>
            <CornerGauge gauge={gauge} />
          </View>
        )}
        {/* Row freely has no segments to show; its own strip comes with U17. */}
        {bars.length > 0 ? (
          <ProgressStrip segments={bars} elapsedMs={gauge.sessionElapsedMs} />
        ) : null}
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill },
  // Added to the safe-area insets: the home indicator already pads the bottom.
  safeArea: {
    flex: 1,
    paddingTop: space.md,
    paddingHorizontal: space.md,
    paddingBottom: space.xs,
    gap: space.xs,
  },
  main: { flex: 1, flexDirection: 'row', gap: space.md },
  side: { flex: 1, justifyContent: 'space-between', gap: space.xs },
  middle: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  labels: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  label: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    backgroundColor: colors.paper,
    borderRadius: radius.chip,
    overflow: 'hidden',
  },
});
