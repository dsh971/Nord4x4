import { StyleSheet, View } from 'react-native';

import { Text } from '../../design/components/Text';
import type { TextColorRole } from '../../design/tokens';
import { typography } from '../../design/typography';

// Shares of the font size: Noto Serif SC has no tabular figures (U7), so each character sits in a cell.
// Its digits advance 0.548 em (measured from the bundled font), so a cell is that plus a little air.
const DIGIT_CELL = 0.58;
const NARROW_CELL = 0.34;

function cellWidth(character: string, fontSize: number): number {
  return fontSize * (/\d/.test(character) ? DIGIT_CELL : NARROW_CELL);
}

/** How wide `text` draws as gauge digits, so a panel can make room for "12:00" as well as "1:48". */
export function gaugeDigitsWidth(text: string, variant: 'gaugeTime' | 'gaugeHeartRate'): number {
  const { fontSize } = typography[variant];
  return [...text].reduce((width, character) => width + cellWidth(character, fontSize), 0);
}

/**
 * A gauge number with every character in a fixed-width cell, so a countdown never shifts sideways as
 * its digits change. VoiceOver reads the whole number once.
 */
export function GaugeDigits({
  text,
  variant,
  color = 'textPrimary',
  testID,
}: {
  text: string;
  variant: 'gaugeTime' | 'gaugeHeartRate';
  color?: TextColorRole;
  testID?: string;
}) {
  const { fontSize } = typography[variant];
  return (
    <View accessible accessibilityLabel={text} testID={testID} style={styles.row}>
      {[...text].map((character, index) => (
        <View key={index} style={{ width: cellWidth(character, fontSize) }}>
          {/* Cells are sized from the token, so the digits ignore iOS text size: they are far
              above R29's minimum already, and scaled glyphs would overprint their cells. */}
          <Text variant={variant} color={color} style={styles.centered} allowFontScaling={false}>
            {character}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  centered: { textAlign: 'center' },
});
