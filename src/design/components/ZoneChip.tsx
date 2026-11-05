import { StyleSheet, View } from 'react-native';

import { colors, radius, space, type ColorRole, type TextColorRole } from '../tokens';
import { Text } from './Text';

/** The heart-rate zone states the gauge can show (R50). */
export type ZoneState = 'inZone' | 'easeOff' | 'build' | 'recovering';

type ChipLook = { label: string; word: string; surface: ColorRole; text: TextColorRole };

// Arrows say which way to go, so they follow the word; dots are status marks, so they lead.
const LOOKS: Record<ZoneState, ChipLook> = {
  inZone: { label: '● In zone', word: 'In zone', surface: 'inZoneSurface', text: 'textSteady' },
  easeOff: { label: 'Ease off ▲', word: 'Ease off', surface: 'easeOffSurface', text: 'textOnInk' },
  build: { label: 'Build ▼', word: 'Build', surface: 'buildSurface', text: 'textPush' },
  recovering: {
    label: '○ Recovering',
    word: 'Recovering',
    surface: 'inZoneSurface',
    text: 'textSteady',
  },
};

/** The zone state as a word plus a shape at 22 pt, so it never relies on colour alone (R50). */
export function ZoneChip({ zone }: { zone: ZoneState }) {
  const look = LOOKS[zone];
  return (
    <View
      accessible
      accessibilityLabel={look.word}
      style={[styles.chip, { backgroundColor: colors[look.surface] }]}
    >
      <Text variant="chip" color={look.text}>
        {look.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: space.xxs,
    paddingHorizontal: 10,
    borderRadius: radius.chip,
  },
});
