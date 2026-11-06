import { useKeepAwake } from 'expo-keep-awake';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { segmentTimings, type SessionPlan } from '../../domain/session/sessionPlan';
import type { SessionSummary } from '../../domain/session/summary';
import { Button } from '../../design/components/Button';
import { Text } from '../../design/components/Text';
import { colors, space } from '../../design/tokens';
import { formatClock, isHardSession, progressBarsOf, summarizePlan } from './gaugeModel';
import { GetSeated } from './GetSeated';
import { InkScene } from './InkScene';
import { PauseSheet } from './PauseSheet';
import { RowingOverlay } from './RowingOverlay';
import type { HeartFeed } from './rowingSession';
import { useRowingSession } from './useRowingSession';

/**
 * One row, start to finish (U7): Get seated with its count-in, then the painted scene under the
 * gauge, banners and strip, long-press pause, and a plain end card until landfall arrives (U20). The
 * screen stays awake while it is open (R34).
 */
export function RowingScreen({
  plan,
  heartFeed,
  onDone,
}: {
  plan: SessionPlan;
  heartFeed: HeartFeed | null;
  onDone: () => void;
}) {
  useKeepAwake();
  const { view, soundError, startNow, pause, resume, endSession } = useRowingSession(
    plan,
    heartFeed,
  );
  const timings = useMemo(() => segmentTimings(plan), [plan]);
  const bars = useMemo(() => progressBarsOf(plan), [plan]);

  if (view.summary !== null) {
    return <SessionEnded summary={view.summary} onDone={onDone} />;
  }
  return (
    <View style={styles.screen}>
      {view.phase === 'getSeated' ? (
        <GetSeated
          remainingMs={view.getSeatedRemainingMs}
          summary={summarizePlan(plan)}
          isHardSession={isHardSession(plan)}
          onStartNow={startNow}
        />
      ) : (
        <>
          <InkScene
            timings={timings}
            sessionMs={view.sessionMs}
            isRunning={view.phase === 'rowing'}
          />
          {view.gauge ? (
            <RowingOverlay gauge={view.gauge} bars={bars} banner={view.banner} onPause={pause} />
          ) : null}
          {view.phase === 'paused' && view.gauge ? (
            <PauseSheet
              gauge={view.gauge}
              reason={view.pauseReason ?? 'longPress'}
              onResume={resume}
              onEndSession={endSession}
            />
          ) : null}
        </>
      )}
      {soundError ? (
        <SafeAreaView style={styles.notice} pointerEvents="none">
          <Text variant="caption" color="textPush" style={styles.noticeText}>
            {soundError}
          </Text>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

/** The row's end, before landfall exists (U20): how it ended, time rowed, and pushes done. */
function SessionEnded({ summary, onDone }: { summary: SessionSummary; onDone: () => void }) {
  const isComplete = summary.outcome === 'completed';
  return (
    <SafeAreaView style={styles.ended}>
      <Text variant="eyebrow" color={isComplete ? 'textSteady' : 'textPush'}>
        {isComplete ? 'Row complete' : 'Partly rowed'}
      </Text>
      <Text variant="headline">{formatClock(summary.rowedMs, 'down')} rowed</Text>
      <Text variant="bodyLarge" color="textSecondary">
        {summary.pushesCompleted} of {summary.pushesPlanned} pushes
        {isComplete ? '' : ' · the ship stays put'}
      </Text>
      <View style={styles.done}>
        <Button label="Done" onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  notice: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  noticeText: { marginTop: space.xs, padding: space.xs, backgroundColor: colors.card },
  ended: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.paper,
  },
  done: { marginTop: space.md, minWidth: 200 },
});
