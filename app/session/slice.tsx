import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { SLICE_PLAN } from '../../src/content/slicePlan';
import { FAKE_MAX_HEART_RATE, fakeHeartRate } from '../../src/dev/fakeHeartTrace';
import { RowingScreen } from '../../src/features/rowing/RowingScreen';

/**
 * Dev-only route: row the slice (U7). `?heart=fake` rows it coached by heart rate against a pretend
 * strap, to try the zone chip and the ease-off on the phone. A release build sends it home.
 */
export default function SliceRoute() {
  const { heart } = useLocalSearchParams<{ heart?: string }>();
  const isFakeHeart = heart === 'fake';
  const plan = useMemo(
    () => (isFakeHeart ? { ...SLICE_PLAN, coachingMode: 'hr' as const } : SLICE_PLAN),
    [isFakeHeart],
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
  return <RowingScreen plan={plan} heartFeed={heartFeed} onDone={() => router.back()} />;
}
