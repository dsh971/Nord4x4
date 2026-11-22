import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SLICE_PLAN } from '../../src/content/slicePlan';
import { Text } from '../../src/design/components/Text';
import { colors, space } from '../../src/design/tokens';
import { FAKE_MAX_HEART_RATE, fakeHeartRate } from '../../src/dev/fakeHeartTrace';
import { chooseSlicePace, planAtSpeed } from '../../src/dev/slicePace';
import { isTestMode } from '../../src/dev/testMode';
import { RowingScreen } from '../../src/features/rowing/RowingScreen';

/**
 * Dev-only route: row the slice (U7). `?heart=fake` rows it coached by heart rate against a pretend
 * strap, to try the zone chip and the ease-off on the phone. `?speed=10`, in test mode only, rows it
 * 10× faster and silent, with Get seated at its real length, for the walkthrough (G7a). A release
 * build sends it home.
 */
export default function SliceRoute() {
  const { heart, speed } = useLocalSearchParams<{ heart?: string; speed?: string }>();
  const isFakeHeart = heart === 'fake';
  const slicePace = useMemo(() => chooseSlicePace(speed, isTestMode), [speed]);
  const speedFactor = 'speed' in slicePace ? slicePace.speed : 1;
  const plan = useMemo(
    () =>
      planAtSpeed(
        isFakeHeart ? { ...SLICE_PLAN, coachingMode: 'hr' as const } : SLICE_PLAN,
        speedFactor,
      ),
    [isFakeHeart, speedFactor],
  );
  const heartFeed = useMemo(
    () =>
      isFakeHeart
        ? { feed: fakeHeartRate(plan), maxHeartRate: FAKE_MAX_HEART_RATE, isMaxEstimated: false }
        : null,
    [isFakeHeart, plan],
  );
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  if ('error' in slicePace) {
    return (
      <View style={styles.error}>
        <Text>{slicePace.error}</Text>
      </View>
    );
  }
  // Keyed on the params, so opening the route again with others starts a fresh row on the new pace.
  return (
    <RowingScreen
      key={`${speed ?? 'real-time'}·${heart ?? 'no-heart'}`}
      plan={plan}
      heartFeed={heartFeed}
      pace={slicePace.pace}
      onDone={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: 'center', padding: space.lg, backgroundColor: colors.paper },
});
