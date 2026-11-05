import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SLICE_PLAN } from '../../content/slicePlan';
import type { SessionPlan } from '../../domain/session/sessionPlan';
import { Text } from '../../design/components/Text';
import { colors, radius, space } from '../../design/tokens';
import { SIGNAL_BANNERS } from '../../features/rowing/banners';
import {
  describeGauge,
  isHardSession,
  progressBarsOf,
  summarizePlan,
  type HeartInput,
} from '../../features/rowing/gaugeModel';
import { GetSeated } from '../../features/rowing/GetSeated';
import { PauseSheet } from '../../features/rowing/PauseSheet';
import { RowingOverlay } from '../../features/rowing/RowingOverlay';
import {
  COOL_DOWN,
  heart,
  HR_SLICE,
  machineAt,
  MINUTE,
  PUSH_2_AT_1_48_LEFT,
  REST_10_S_BEFORE_PUSH_2,
  ROW_FREELY,
  SECOND,
} from './sliceMoments';

function rowing(
  sessionMs: number,
  options: {
    plan?: SessionPlan;
    heart?: HeartInput;
    banner?: keyof typeof SIGNAL_BANNERS;
  } = {},
): ReactNode {
  // A heart reading only leads in a heart-rate plan (KTD21), as G5's fake trace will row it.
  const plan = options.plan ?? (options.heart ? HR_SLICE : SLICE_PLAN);
  const gauge = describeGauge(plan, machineAt(sessionMs, plan).snapshot(), options.heart ?? null);
  if (gauge === null) {
    return <Text>No gauge at {sessionMs} ms</Text>;
  }
  return (
    <RowingOverlay
      gauge={gauge}
      bars={progressBarsOf(plan)}
      banner={options.banner ? SIGNAL_BANNERS[options.banner] : null}
      onPause={() => undefined}
    />
  );
}

function getSeated(remainingMs: number): ReactNode {
  return (
    <GetSeated
      remainingMs={remainingMs}
      summary={summarizePlan(SLICE_PLAN)}
      isHardSession={isHardSession(SLICE_PLAN)}
      onStartNow={() => undefined}
    />
  );
}

function paused(): ReactNode {
  const machine = machineAt(PUSH_2_AT_1_48_LEFT);
  machine.pause('longPress');
  const gauge = describeGauge(SLICE_PLAN, machine.snapshot(), null);
  return gauge ? (
    <PauseSheet
      gauge={gauge}
      reason="longPress"
      onResume={() => undefined}
      onEndSession={() => undefined}
    />
  ) : (
    <Text>No gauge while paused</Text>
  );
}

const STATES: { name: string; render: () => ReactNode }[] = [
  { name: 'Push 2 · effort (board 3.6)', render: () => rowing(PUSH_2_AT_1_48_LEFT) },
  {
    name: 'Push 2 · heart rate in zone (3.2)',
    render: () => rowing(PUSH_2_AT_1_48_LEFT, { heart: heart(159) }),
  },
  {
    name: 'Ease off (3.2b)',
    render: () => rowing(PUSH_2_AT_1_48_LEFT, { heart: heart(178, { isGlowing: true }) }),
  },
  {
    name: 'Rest · war horn (3.3)',
    render: () => rowing(REST_10_S_BEFORE_PUSH_2, { banner: 'horn' }),
  },
  {
    name: 'Rest · heart rate recovering',
    render: () => rowing(REST_10_S_BEFORE_PUSH_2, { heart: heart(131) }),
  },
  {
    name: 'Push starts · Pull',
    render: () => rowing(16 * MINUTE + SECOND, { banner: 'pushStart' }),
  },
  {
    name: 'Hold this effort',
    render: () => rowing(17 * MINUTE + 30 * SECOND, { banner: 'holdEffort' }),
  },
  { name: 'Cool-down · keep paddling (R61)', render: () => rowing(COOL_DOWN) },
  { name: 'Row freely · 12:00 rowed', render: () => rowing(12 * MINUTE, { plan: ROW_FREELY }) },
  { name: 'Get seated (3.1a)', render: () => getSeated(14 * SECOND) },
  { name: 'Get seated · count-in', render: () => getSeated(2_400) },
  { name: 'Paused (3.5)', render: paused },
];

/**
 * G3's phone check: each rowing overlay state from the boards, over a plain wash until the scene
 * exists (G4), to judge readability at 1 m in both orientations. Tap the caption to step on.
 */
export function RowingStatesScreen() {
  const [index, setIndex] = useState(0);
  const state = STATES[index % STATES.length];
  return (
    <View style={styles.screen}>
      {state?.render()}
      <SafeAreaView style={styles.captionArea} pointerEvents="box-none">
        <Pressable
          onPress={() => setIndex((current) => current + 1)}
          style={styles.caption}
          accessibilityRole="button"
        >
          <Text variant="caption">
            {(index % STATES.length) + 1}/{STATES.length} · {state?.name} · tap for next
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.wash },
  // Top left, clear of the gauge in the top right.
  captionArea: { ...StyleSheet.absoluteFill, alignItems: 'flex-start' },
  caption: {
    marginTop: space.xs,
    marginLeft: space.md,
    padding: space.xs,
    backgroundColor: colors.card,
    borderRadius: radius.chip,
  },
});
