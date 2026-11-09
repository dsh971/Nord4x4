import { StyleSheet, View } from 'react-native';

import { Text } from '../../design/components/Text';
import { ZoneChip } from '../../design/components/ZoneChip';
import { colors, radius, space } from '../../design/tokens';
import { GaugeDigits, gaugeDigitsWidth } from './GaugeDigits';
import { formatClock, formatGaugeClock, type GaugeModel } from './gaugeModel';

// The landscape panel's width (U17); a clock of 10:00 or more widens it rather than shrink below R29.
const GAUGE_WIDTH = 224;
const PANEL_INSET = 2 * space.sm + 2;
// "Rate 26–28 spm" fills about 146 of the panel's 198 pt; larger text would push it out of the panel.
const RATE_MAX_FONT_SCALE = 1.3;

// Copy, not the model's words: the label may change without renaming the union.
const CLOCK_LABELS: Record<GaugeModel['clock']['kind'], string> = { left: 'left', rowed: 'rowed' };

/**
 * The gauge (R29): segment, time left, effort or heart rate, and the stroke rate to aim for. In a
 * rest the rate shrinks to a small line so the next push still fits the landscape panel's height. In
 * landscape it is a corner panel sized for the session's widest clock (board 3.2), and the rowing
 * overlay shows the cool-down line beside it; in portrait it stretches across as a band holding that
 * line too. The band keeps the panel's stacking until U17 lays it out as board 3.2p.
 */
export function CornerGauge({ gauge, isBand = false }: { gauge: GaugeModel; isBand?: boolean }) {
  const isPush = gauge.eyebrowTone === 'push';
  const clock = formatGaugeClock(gauge.clock);
  const { rate } = gauge.footer;
  const rateLabel = `Stroke rate ${rate.low} to ${rate.high} per minute`;
  const panelWidth = Math.max(
    GAUGE_WIDTH,
    gaugeDigitsWidth(gauge.widestClock, 'gaugeTime') + PANEL_INSET,
  );
  return (
    <View style={[styles.panel, isBand ? null : { width: panelWidth }]} testID="corner-gauge">
      <View style={styles.header}>
        <Text variant="eyebrow" color={isPush ? 'textPush' : 'textSteady'}>
          {gauge.eyebrow}
        </Text>
        <Text variant="body" color="textSecondary">
          {CLOCK_LABELS[gauge.clock.kind]}
        </Text>
      </View>
      <GaugeDigits
        text={clock}
        variant="gaugeTime"
        color={gauge.clockTone === 'push' ? 'textPush' : 'textPrimary'}
        testID="gauge-time"
      />
      <View style={styles.rule} />
      {gauge.body.kind === 'effort' ? (
        <View testID="gauge-effort">
          <View style={styles.reading}>
            <Text variant="gaugeHeartRate" style={styles.effortNumber}>
              {gauge.body.guide.effort}
            </Text>
            <Text variant="body" color="textSecondary">
              of 10 effort
            </Text>
          </View>
          <Text
            variant="bodyStrong"
            color={isPush ? 'textPush' : 'textSteady'}
            style={styles.speech}
          >
            {gauge.body.guide.speech}
          </Text>
          <Text variant="caption" color="textSecondary">
            {gauge.body.guide.talkTest}
          </Text>
        </View>
      ) : (
        <View testID="gauge-heart" style={styles.heart}>
          <View style={styles.reading}>
            <Text
              variant="title"
              color={isPush ? 'textPush' : 'textSteady'}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              ♥
            </Text>
            <GaugeDigits text={String(gauge.body.bpm)} variant="gaugeHeartRate" />
            <Text variant="body" color="textSecondary">
              bpm
            </Text>
          </View>
          {gauge.body.zone ? <ZoneChip zone={gauge.body.zone} /> : null}
          {gauge.body.target ? (
            <Text variant="caption" color="textSecondary">
              target {gauge.body.target.lowBpm}–{gauge.body.target.highBpm}
            </Text>
          ) : null}
        </View>
      )}
      {isBand && gauge.note ? (
        <Text variant="bodyStrong" color="textSteady">
          {gauge.note}
        </Text>
      ) : null}
      {gauge.footer.nextPush ? (
        <>
          <Text
            variant="caption"
            color="textSecondary"
            accessibilityLabel={rateLabel}
            maxFontSizeMultiplier={RATE_MAX_FONT_SCALE}
            testID="gauge-rate"
          >
            Rate {rate.low}–{rate.high} spm
          </Text>
          <View style={styles.reading}>
            <Text variant="headline" color="textPush" style={styles.footerNumber}>
              Next
            </Text>
            <Text variant="body" color="textSecondary">
              push {gauge.footer.nextPush.pushNumber} · {formatClock(gauge.footer.nextPush.pushMs)}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.reading} accessible accessibilityLabel={rateLabel} testID="gauge-rate">
          <Text variant="body" color="textSecondary" maxFontSizeMultiplier={RATE_MAX_FONT_SCALE}>
            Rate
          </Text>
          <Text
            variant="headline"
            style={styles.footerNumber}
            maxFontSizeMultiplier={RATE_MAX_FONT_SCALE}
          >
            {rate.low}–{rate.high}
          </Text>
          <Text variant="body" color="textSecondary" maxFontSizeMultiplier={RATE_MAX_FONT_SCALE}>
            spm
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    gap: space.xxs,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rule: { height: 1, backgroundColor: colors.line },
  reading: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  heart: { gap: space.xxs },
  effortNumber: { fontSize: 48, lineHeight: 52 },
  speech: { fontSize: 17, lineHeight: 22 },
  footerNumber: { fontSize: 28, lineHeight: 32 },
});
