import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COUNT_IN_BEATS } from '../../domain/session/sessionMachine';
import { useIsPortrait } from '../../design/useIsPortrait';
import { Button } from '../../design/components/Button';
import { Text } from '../../design/components/Text';
import { colors, space } from '../../design/tokens';
import { STOP_LINE } from './copy';
import { GaugeDigits } from './GaugeDigits';
import { countWord, formatClock } from './gaugeModel';

const COUNT_IN_MS = COUNT_IN_BEATS * 1000;
const PHASES = [
  { name: 'Catch', cue: 'Shins vertical, arms long' },
  { name: 'Drive', cue: 'Push with the legs' },
  { name: 'Finish', cue: 'Lean back, pull to ribs' },
  { name: 'Recovery', cue: 'Arms, body, then legs' },
];

/**
 * Get seated (R23, R61, board 3.1a): the countdown to the row, then big 5-4-3-2-1 in its last five
 * seconds, the stop line before a hard session, and Start now. The stroke shows as its four phases
 * with the catch marked; the drawn figure comes with the scene (G4) and its animation in U17.
 */
export function GetSeated({
  remainingMs,
  summary,
  isHardSession,
  onStartNow,
}: {
  remainingMs: number;
  summary: string;
  isHardSession: boolean;
  onStartNow: () => void;
}) {
  const isPortrait = useIsPortrait();
  const isCountingIn = remainingMs <= COUNT_IN_MS;
  const stopLine = isHardSession ? (
    <Text variant="bodyStrong" style={styles.stopLine} testID="stop-line">
      {STOP_LINE}
    </Text>
  ) : null;
  const stroke = (
    <View style={[styles.stroke, isPortrait && styles.strokePortrait]}>
      <Text variant="eyebrow" color="textMuted">
        One stroke · start at the catch
      </Text>
      {/* Landscape has height to spare beside the countdown, so the stop line sits here. */}
      {isPortrait ? null : stopLine}
      <View style={styles.phases}>
        {PHASES.map((phase, index) => (
          <View key={phase.name} style={[styles.phase, index === 0 && styles.currentPhase]}>
            <Text variant="bodyStrong" color={index === 0 ? 'textPush' : 'textSecondary'}>
              {phase.name}
            </Text>
            <Text variant="body" color={index === 0 ? 'textPush' : 'textSecondary'}>
              {phase.cue}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
  const start = (
    <ScrollView
      style={isPortrait ? styles.startPortrait : styles.start}
      contentContainerStyle={styles.startContent}
      bounces={false}
    >
      <Text variant="eyebrow" color="textMuted">
        Get seated · starting in
      </Text>
      {isCountingIn ? (
        <Text variant="gaugeTime" style={styles.countIn} testID="count-in">
          {Math.max(1, Math.ceil(remainingMs / 1000))}
        </Text>
      ) : (
        <GaugeDigits text={formatClock(remainingMs)} variant="gaugeTime" testID="get-seated-time" />
      )}
      <Text variant="headline">Feet in. Sit tall.</Text>
      <Text variant="bodyLarge" color="textSecondary">
        {countWord(COUNT_IN_BEATS)} drum beats count you in.
      </Text>
      {isPortrait ? stopLine : null}
      <Text variant="bodyLarge" color="textSecondary">
        {summary}
      </Text>
      <View style={styles.button}>
        <Button label="Start now" variant="secondary" onPress={onStartNow} />
      </View>
    </ScrollView>
  );
  // Tree order is reading order, so VoiceOver meets the countdown first in portrait.
  return isPortrait ? (
    <SafeAreaView style={[styles.screen, styles.portrait]}>
      {start}
      <View style={styles.dividerAcross} />
      {stroke}
    </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.screen}>
      {stroke}
      <View style={styles.divider} />
      {start}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Added to the safe-area insets, which already clear the cut-out and the home indicator.
  screen: { flex: 1, flexDirection: 'row', backgroundColor: colors.paper, padding: space.md },
  portrait: { flexDirection: 'column' },
  stroke: { flex: 1, justifyContent: 'space-between', gap: space.md },
  strokePortrait: { flex: 0 },
  phases: { flexDirection: 'row', gap: space.md },
  phase: { flex: 1, paddingBottom: space.xs },
  currentPhase: { borderBottomWidth: 3, borderBottomColor: colors.push },
  divider: { width: 1, marginHorizontal: space.lg, backgroundColor: colors.line },
  dividerAcross: { height: 1, marginVertical: space.md, backgroundColor: colors.line },
  start: { flex: 1.3 },
  startPortrait: { flex: 1 },
  startContent: { gap: space.xs },
  // The count-in numeral takes the clock's place without making the column taller.
  countIn: { fontSize: 96, lineHeight: 92 },
  stopLine: { fontSize: 17, lineHeight: 24 },
  button: { alignSelf: 'flex-start', marginTop: space.xs },
});
