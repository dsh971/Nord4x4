import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COUNT_IN_BEATS } from '../../domain/session/sessionMachine';
import { useIsPortrait } from '../../design/useIsPortrait';
import { Button } from '../../design/components/Button';
import { Text } from '../../design/components/Text';
import { colors, space } from '../../design/tokens';
import { typography } from '../../design/typography';
import { CatchFigure } from './CatchFigure';
import { STOP_LINE } from './copy';
import { GaugeDigits } from './GaugeDigits';
import { countWord, formatClock } from './gaugeModel';

const COUNT_IN_MS = COUNT_IN_BEATS * 1000;
const COUNT_IN_FONT_SIZE = 96;
// Rounded up to an even number, so the ratio never drops below the clock's and the margins that
// hand back the extra height are whole points.
const COUNT_IN_LINE_HEIGHT =
  2 *
  Math.ceil(
    (COUNT_IN_FONT_SIZE * typography.gaugeTime.lineHeight) / typography.gaugeTime.fontSize / 2,
  );
const PHASES = [
  { name: 'Catch', cue: 'Shins vertical, arms long' },
  { name: 'Drive', cue: 'Push with the legs' },
  { name: 'Finish', cue: 'Lean back, pull to ribs' },
  { name: 'Recovery', cue: 'Arms, body, then legs' },
];

/**
 * Get seated (R23, R61, board 3.1a): the countdown to the row, then big 5-4-3-2-1 in its last five
 * seconds, the stop line before a hard session, and Start now. The stroke shows as a still catch
 * above its four phases; the figure animates through them in U17.
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
      <CatchFigure />
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
        // Unscaled like the clock's digits: 96 pt is far above R29's minimum, and a scaled numeral
        // would outgrow the clock's slot and push everything below it down at the count-in.
        <Text variant="gaugeTime" style={styles.countIn} allowFontScaling={false} testID="count-in">
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
  // Noto Serif SC's natural line is about 1.44 em, and iOS trims a shorter line from the top. At
  // 96/92 the trim cut into the digits; the clock's 88/84 leaves them whole on the phone, so the
  // numeral keeps that ratio, and negative margins hand back the extra so it fills the clock's slot.
  countIn: {
    fontSize: COUNT_IN_FONT_SIZE,
    lineHeight: COUNT_IN_LINE_HEIGHT,
    marginVertical: (typography.gaugeTime.lineHeight - COUNT_IN_LINE_HEIGHT) / 2,
  },
  stopLine: { fontSize: 17, lineHeight: 24 },
  button: { alignSelf: 'flex-start', marginTop: space.xs },
});
