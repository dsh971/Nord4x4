import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../design/components/Button';
import { IntervalShape } from '../../design/components/IntervalShape';
import { ProgressStrip } from '../../design/components/ProgressStrip';
import type { BarSegment } from '../../design/components/SegmentBars';
import { ShipIcon } from '../../design/components/ShipIcon';
import { Text } from '../../design/components/Text';
import { ZoneChip, type ZoneState } from '../../design/components/ZoneChip';
import { colors, radius, space, type ColorRole } from '../../design/tokens';

const MINUTE = 60_000;

// Week 3: 3×3′ with 3′ rests, as on board 2.1.
const WEEK_3_SHAPE: BarSegment[] = [
  { kind: 'easy', durationMs: 10 * MINUTE },
  { kind: 'push', durationMs: 3 * MINUTE },
  { kind: 'rest', durationMs: 3 * MINUTE },
  { kind: 'push', durationMs: 3 * MINUTE },
  { kind: 'rest', durationMs: 3 * MINUTE },
  { kind: 'push', durationMs: 3 * MINUTE },
  { kind: 'easy', durationMs: 5 * MINUTE },
];

const WEEK_3_STRIP: BarSegment[] = [
  { kind: 'easy', durationMs: 4 * MINUTE },
  { kind: 'pickup', durationMs: MINUTE / 3 },
  { kind: 'easy', durationMs: (5 * MINUTE) / 3 },
  { kind: 'pickup', durationMs: MINUTE / 3 },
  { kind: 'easy', durationMs: (11 * MINUTE) / 3 },
  { kind: 'push', durationMs: 3 * MINUTE },
  { kind: 'rest', durationMs: 3 * MINUTE },
  { kind: 'push', durationMs: 3 * MINUTE },
  { kind: 'rest', durationMs: 3 * MINUTE },
  { kind: 'push', durationMs: 3 * MINUTE },
  { kind: 'easy', durationMs: 5 * MINUTE },
];

const ZONES: ZoneState[] = ['inZone', 'easeOff', 'build', 'recovering'];
const SWATCHES: ColorRole[] = [
  'paper',
  'primary',
  'push',
  'steady',
  'easeOffSurface',
  'destructive',
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="eyebrow" color="textSecondary">
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Dev-only: the slice's tokens and components, laid out to compare with boards 2.1 and 3.2. */
export function GalleryScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <ShipIcon />
          <Text variant="title" style={styles.brandName}>
            Nor4x4
          </Text>
        </View>

        <Section title="Type · board 2.1">
          <Text variant="eyebrow" color="textSecondary">
            Week 3 · Lerwick → Fair Isle
          </Text>
          <Text variant="headline">
            Today, three <Text variant="headlineStrong">pushes.</Text>
          </Text>
          <Text variant="body" color="textSecondary">
            Push at 156–166 bpm · 3′ easy between
          </Text>
          <Text variant="caption" color="textMuted">
            Counts this week. Doesn&apos;t move the ship.
          </Text>
        </Section>

        <Section title="Today card">
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="title">Three 3′ pushes</Text>
              <Text variant="caption" color="textMuted">
                30 min
              </Text>
            </View>
            <Text color="textSecondary">Push at 156–166 bpm · 3′ easy between</Text>
            <IntervalShape segments={WEEK_3_SHAPE} />
            <Button label="Set out" onPress={() => undefined} />
            <Text color="textLink">Short on time? One 4′ push instead · 19 min</Text>
          </View>
          <Button label="Row freely" variant="secondary" onPress={() => undefined} />
        </Section>

        <Section title="Gauge · board 3.2">
          <View style={styles.card}>
            <Text variant="eyebrow" color="textPush">
              Push 2 of 3
            </Text>
            <Text variant="gaugeTime">1:48</Text>
            <View style={styles.heartRate}>
              <Text variant="gaugeHeartRate">159</Text>
              <Text color="textMuted">bpm</Text>
            </View>
            {ZONES.map((zone) => (
              <ZoneChip key={zone} zone={zone} />
            ))}
          </View>
          <ProgressStrip segments={WEEK_3_STRIP} elapsedMs={(17 + 12 / 60) * MINUTE} />
        </Section>

        <Section title="Colour roles">
          <View style={styles.swatches}>
            {SWATCHES.map((role) => (
              <View key={role} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: colors[role] }]} />
                <Text variant="caption" color="textSecondary">
                  {role}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: space.lg, gap: space.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  brandName: { fontSize: 24 },
  section: { gap: space.sm },
  card: {
    gap: space.sm,
    padding: space.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  heartRate: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  swatch: { alignItems: 'center', gap: space.xxs },
  swatchColor: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
