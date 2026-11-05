import { useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PauseReason } from '../../domain/session/sessionMachine';
import { Button } from '../../design/components/Button';
import { Text } from '../../design/components/Text';
import { colors, radius, space } from '../../design/tokens';
import { STOP_LINE } from './copy';
import { formatGaugeClock, type GaugeModel } from './gaugeModel';

// How long End session must be held, so a rower who meant Resume can't end the row (R32).
const END_HOLD_MS = 1_500;

const REASONS: Record<PauseReason, string> = {
  longPress: 'Paused by a long press. The ship waits for you.',
  interruption: 'Paused while your phone took the sound. The ship waits for you.',
};

/**
 * The slice's pause sheet (R32, board 3.5): where the row stands, why it paused, the stop line,
 * Resume, and End session, which fills as it is held. Restart this push and the sound modes come
 * with the full sheet in U17.
 */
export function PauseSheet({
  gauge,
  reason,
  onResume,
  onEndSession,
}: {
  gauge: GaugeModel;
  reason: PauseReason;
  onResume: () => void;
  onEndSession: () => void;
}) {
  const [hold] = useState(() => new Animated.Value(0));
  const holdTo = (value: number, duration: number) =>
    Animated.timing(hold, { toValue: value, duration, useNativeDriver: false }).start();

  return (
    // Modal on the scrim, the rowing overlay's sibling, so VoiceOver can't reach the row behind it.
    <View style={styles.scrim} accessibilityViewIsModal>
      <SafeAreaView style={styles.safeArea}>
        {/* A landscape phone is barely taller than the sheet, so it scrolls rather than clip. */}
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          bounces={false}
        >
          <Text variant="eyebrow" color="textPush">
            Paused · {gauge.eyebrow}
          </Text>
          <View style={styles.reading}>
            <Text variant="headline">{formatGaugeClock(gauge.clock)}</Text>
            <Text variant="bodyLarge" color="textSecondary">
              {gauge.clock.kind === 'rowed'
                ? 'rowed'
                : `left in this ${gauge.segmentType === 'push' ? 'push' : 'stretch'}`}
            </Text>
          </View>
          <Text variant="body" color="textSecondary">
            {REASONS[reason]}
          </Text>
          <Text variant="bodyStrong">{STOP_LINE}</Text>
          <Button label="Resume" onPress={onResume} />
          <Pressable
            onPressIn={() => holdTo(1, END_HOLD_MS)}
            onPressOut={() => holdTo(0, 150)}
            onLongPress={onEndSession}
            delayLongPress={END_HOLD_MS}
            accessibilityRole="button"
            accessibilityLabel="Hold to end session"
            accessibilityHint="Ends the row early and saves it as Partly rowed"
            // A VoiceOver double-tap is already deliberate, so it ends the row without the hold.
            accessibilityActions={[{ name: 'activate', label: 'End session' }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'activate') {
                onEndSession();
              }
            }}
            style={styles.end}
            testID="end-session"
          >
            <Animated.View
              style={[
                styles.endFill,
                { width: hold.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
            <Text variant="button" color="textDestructive">
              Hold to end session
            </Text>
          </Pressable>
          <Text variant="caption" color="textSecondary">
            Ending early saves this as Partly rowed. The ship stays put.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(28, 27, 26, 0.45)' },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xs },
  sheet: {
    flexGrow: 0,
    width: 480,
    maxWidth: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.card,
  },
  sheetContent: { gap: space.xs, padding: space.lg },
  reading: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  end: {
    alignItems: 'center',
    paddingVertical: space.sm,
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: radius.control,
    overflow: 'hidden',
  },
  endFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.destructiveHold,
  },
});
